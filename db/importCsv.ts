import {
  isOpeningType,
  parseCsvTime,
  parseMoneyCsv,
  parseTransferAccounts,
  type CsvRow,
} from "@/lib/csv";
import { toIsoLocal } from "@/lib/datetime";
import { createId } from "@/lib/id";
import { analysisColor } from "@/lib/analysisPalette";
import { parsePersonRole } from "@/lib/personRole";

import type { SQLiteDatabase } from "expo-sqlite";

import { log } from "@/lib/logger";

import { withDb } from "./client";
import type { RecordType } from "./types";

export type ImportMode = "append" | "replace";

export type ImportCsvOptions = {
  /** Inclusive start of day (local). Null/undefined = no lower bound. */
  from?: Date | null;
  /** Inclusive end of day (local). Null/undefined = no upper bound. */
  to?: Date | null;
};

export type ImportResult = {
  imported: number;
  openingsApplied: number;
  skipped: number;
  skippedOutOfRange: number;
  accountsCreated: number;
  categoriesCreated: number;
  peopleCreated: number;
  occasionsCreated: number;
  errors: string[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function inImportRange(when: Date, from: Date | null, to: Date | null): boolean {
  if (from && when < from) return false;
  if (to && when > to) return false;
  return true;
}

function mapType(raw: string): { type: RecordType; isAdjustment: boolean } | null {
  const t = raw.toLowerCase();
  if (isOpeningType(raw)) return null;
  if (t.includes("adjustment")) {
    const out = t.includes("-") || t.includes("out") || t.includes("expense");
    return { type: out ? "expense" : "income", isAdjustment: true };
  }
  if (t.includes("expense")) return { type: "expense", isAdjustment: false };
  if (t.includes("income")) return { type: "income", isAdjustment: false };
  if (t.includes("transfer")) return { type: "transfer", isAdjustment: false };
  return null;
}

function isBlankCategory(name: string) {
  const n = name.trim();
  return !n || n === "-" || n === "—";
}

export async function importMoneyCsv(
  text: string,
  mode: ImportMode = "replace",
  options: ImportCsvOptions = {},
): Promise<ImportResult> {
  const rows = parseMoneyCsv(text);
  if (rows.length === 0) {
    throw new Error("CSV has no data rows");
  }

  const from = options.from ? startOfDay(options.from) : null;
  const to = options.to ? endOfDay(options.to) : null;
  log.info("CSV import start", {
    mode,
    rows: rows.length,
    bytes: text.length,
    from: from?.toISOString() ?? null,
    to: to?.toISOString() ?? null,
  });

  return withDb(async (db) => {
    const result: ImportResult = {
      imported: 0,
      openingsApplied: 0,
      skipped: 0,
      skippedOutOfRange: 0,
      accountsCreated: 0,
      categoriesCreated: 0,
      peopleCreated: 0,
      occasionsCreated: 0,
      errors: [],
    };

    const accountIds = new Map<string, string>();
    const categoryIds = new Map<string, string>(); // key: type|name
    const personIds = new Map<string, string>();
    const occasionIds = new Map<string, string>();

    async function ensureAccount(name: string): Promise<string> {
      const key = name.trim();
      const cached = accountIds.get(key.toLowerCase());
      if (cached) return cached;

      const existing = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM accounts WHERE name = ? COLLATE NOCASE LIMIT 1",
        key,
      );
      if (existing) {
        accountIds.set(key.toLowerCase(), existing.id);
        return existing.id;
      }

      const max = await db.getFirstAsync<{ m: number }>(
        "SELECT COALESCE(MAX(sort_order), -1) AS m FROM accounts",
      );
      const id = createId("acc");
      await db.runAsync(
        `INSERT INTO accounts (id, name, icon_key, opening_balance, sort_order, archived)
         VALUES (?, ?, 'wallet', 0, ?, 0)`,
        id,
        key,
        (max?.m ?? -1) + 1,
      );
      accountIds.set(key.toLowerCase(), id);
      result.accountsCreated += 1;
      return id;
    }

    async function ensureCategory(
      name: string,
      type: "income" | "expense",
    ): Promise<string> {
      const key = `${type}|${name.trim().toLowerCase()}`;
      const cached = categoryIds.get(key);
      if (cached) return cached;

      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM categories
         WHERE type = ? AND name = ? COLLATE NOCASE LIMIT 1`,
        type,
        name.trim(),
      );
      if (existing) {
        categoryIds.set(key, existing.id);
        return existing.id;
      }

      const max = await db.getFirstAsync<{ m: number }>(
        "SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories WHERE type = ?",
        type,
      );
      const id = createId("cat");
      const icon_key = type === "income" ? "wallet" : "pricetag";
      const sort_order = (max?.m ?? -1) + 1;
      await db.runAsync(
        `INSERT INTO categories (id, name, type, icon_key, color, sort_order, archived)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        id,
        name.trim(),
        type,
        icon_key,
        analysisColor(sort_order),
        sort_order,
      );
      categoryIds.set(key, id);
      result.categoriesCreated += 1;
      return id;
    }

    async function ensurePerson(name: string): Promise<string> {
      const key = name.trim();
      const cached = personIds.get(key.toLowerCase());
      if (cached) return cached;

      const existing = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM people WHERE name = ? COLLATE NOCASE LIMIT 1",
        key,
      );
      if (existing) {
        personIds.set(key.toLowerCase(), existing.id);
        return existing.id;
      }

      const id = createId("per");
      await db.runAsync(
        `INSERT INTO people (id, name, note, archived, converted_from_account_id)
         VALUES (?, ?, '', 0, NULL)`,
        id,
        key,
      );
      personIds.set(key.toLowerCase(), id);
      result.peopleCreated += 1;
      return id;
    }

    async function ensureOccasion(title: string, occurredAt: string): Promise<string> {
      const key = `${title.trim().toLowerCase()}|${occurredAt.slice(0, 10)}`;
      const cached = occasionIds.get(key);
      if (cached) return cached;
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM occasions WHERE title = ? COLLATE NOCASE AND substr(occurred_at, 1, 10) = ? LIMIT 1`,
        title.trim(),
        occurredAt.slice(0, 10),
      );
      if (existing) {
        occasionIds.set(key, existing.id);
        return existing.id;
      }
      const id = createId("occ");
      await db.runAsync(
        `INSERT INTO occasions (id, title, occurred_at, note) VALUES (?, ?, ?, '')`,
        id,
        title.trim(),
        occurredAt,
      );
      occasionIds.set(key, id);
      result.occasionsCreated += 1;
      return id;
    }

    await db.withTransactionAsync(async () => {
      if (mode === "replace") {
        // Full override: ledger matches the CSV only (settings kept).
        await db.runAsync("DELETE FROM budgets");
        await db.runAsync("DELETE FROM records");
        await db.runAsync("DELETE FROM occasions");
        await db.runAsync("DELETE FROM people");
        await db.runAsync("DELETE FROM categories");
        await db.runAsync("DELETE FROM accounts");
        accountIds.clear();
        categoryIds.clear();
        personIds.clear();
        occasionIds.clear();
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (isOpeningType(row.type)) {
            // Opening balances are not dated ledger rows — always apply when present.
            await importOpeningRow(db, row, ensureAccount);
            result.openingsApplied += 1;
          } else {
            const when = parseCsvTime(row.time);
            if (!inImportRange(when, from, to)) {
              result.skippedOutOfRange += 1;
              continue;
            }
            await importOneRow(db, row, ensureAccount, ensureCategory, ensurePerson, ensureOccasion);
            result.imported += 1;
          }
        } catch (e) {
          result.skipped += 1;
          if (result.errors.length < 25) {
            result.errors.push(
              `Row ${i + 2}: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
      }
    });

    log.info("CSV import complete", result);
    return result;
  });
}

async function importOpeningRow(
  db: SQLiteDatabase,
  row: CsvRow,
  ensureAccount: (name: string) => Promise<string>,
) {
  if (!row.account.trim()) throw new Error("ACCOUNT is required for opening balance");
  const amount = Number(row.amount);
  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    throw new Error(`Invalid opening AMOUNT "${row.amount}"`);
  }
  const accountId = await ensureAccount(row.account);
  await db.runAsync(
    "UPDATE accounts SET opening_balance = ? WHERE id = ?",
    amount,
    accountId,
  );
}

async function importOneRow(
  db: SQLiteDatabase,
  row: CsvRow,
  ensureAccount: (name: string) => Promise<string>,
  ensureCategory: (name: string, type: "income" | "expense") => Promise<string>,
  ensurePerson: (name: string) => Promise<string>,
  ensureOccasion: (title: string, occurredAt: string) => Promise<string>,
) {
  const mapped = mapType(row.type);
  if (!mapped) throw new Error(`Unknown TYPE "${row.type}"`);
  const { type, isAdjustment } = mapped;

  const amount = Number(row.amount);
  if (!(amount > 0) || Number.isNaN(amount)) {
    throw new Error(`Invalid AMOUNT "${row.amount}"`);
  }

  const occurred = toIsoLocal(parseCsvTime(row.time));
  const note = row.notes ?? "";
  const id = createId("rec");
  let personId: string | null = null;
  let personRole: string | null = null;
  if (!isAdjustment && row.person.trim()) {
    personId = await ensurePerson(row.person);
    personRole = parsePersonRole(row.personRole) ?? "with";
  }
  const occasionId =
    !isAdjustment && row.occasion.trim()
      ? await ensureOccasion(row.occasion, occurred)
      : null;

  if (type === "transfer") {
    const { from, to } = parseTransferAccounts(row.account);
    const accountId = await ensureAccount(from);
    const toAccountId = await ensureAccount(to);
    if (accountId === toAccountId) {
      throw new Error("Transfer From and To are the same account");
    }
    await db.runAsync(
      `INSERT INTO records
         (id, type, amount, category_id, account_id, to_account_id, note, occurred_at, person_id, person_role, is_adjustment, occasion_id)
       VALUES (?, 'transfer', ?, NULL, ?, ?, ?, ?, ?, ?, 0, ?)`,
      id,
      amount,
      accountId,
      toAccountId,
      note,
      occurred,
      personId,
      personRole === "with" || personRole === "gift" ? personRole : personId ? "with" : null,
      occasionId,
    );
    return;
  }

  if (!row.account.trim()) throw new Error("ACCOUNT is required");
  const accountId = await ensureAccount(row.account);
  let categoryId: string | null = null;
  if (!isAdjustment && !isBlankCategory(row.category)) {
    categoryId = await ensureCategory(row.category, type);
  }

  await db.runAsync(
      `INSERT INTO records
       (id, type, amount, category_id, account_id, to_account_id, note, occurred_at, person_id, person_role, is_adjustment, occasion_id)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
    id,
    type,
    amount,
    categoryId,
    accountId,
    note,
    occurred,
    personId,
    personRole,
    isAdjustment ? 1 : 0,
    occasionId,
  );
}
