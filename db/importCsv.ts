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

import { getDb } from "./client";
import type { RecordType } from "./types";

export type ImportMode = "append" | "replace";

export type ImportResult = {
  imported: number;
  openingsApplied: number;
  skipped: number;
  accountsCreated: number;
  categoriesCreated: number;
  errors: string[];
};

function mapType(raw: string): RecordType | null {
  const t = raw.toLowerCase();
  if (isOpeningType(raw)) return null;
  if (t.includes("expense")) return "expense";
  if (t.includes("income")) return "income";
  if (t.includes("transfer")) return "transfer";
  return null;
}

function isBlankCategory(name: string) {
  const n = name.trim();
  return !n || n === "-" || n === "—";
}

export async function importMoneyCsv(
  text: string,
  mode: ImportMode = "replace",
): Promise<ImportResult> {
  const rows = parseMoneyCsv(text);
  if (rows.length === 0) {
    throw new Error("CSV has no data rows");
  }

  const db = await getDb();
  const result: ImportResult = {
    imported: 0,
    openingsApplied: 0,
    skipped: 0,
    accountsCreated: 0,
    categoriesCreated: 0,
    errors: [],
  };

  const accountIds = new Map<string, string>();
  const categoryIds = new Map<string, string>(); // key: type|name

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

  async function ensureCategory(name: string, type: "income" | "expense"): Promise<string> {
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

  await db.withTransactionAsync(async () => {
    if (mode === "replace") {
      // Full override: ledger matches the CSV only (settings kept).
      await db.runAsync("DELETE FROM budgets");
      await db.runAsync("DELETE FROM records");
      await db.runAsync("DELETE FROM categories");
      await db.runAsync("DELETE FROM accounts");
      accountIds.clear();
      categoryIds.clear();
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (isOpeningType(row.type)) {
          await importOpeningRow(row, ensureAccount);
          result.openingsApplied += 1;
        } else {
          await importOneRow(row, ensureAccount, ensureCategory);
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

  return result;
}

async function importOpeningRow(
  row: CsvRow,
  ensureAccount: (name: string) => Promise<string>,
) {
  const db = await getDb();
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
  row: CsvRow,
  ensureAccount: (name: string) => Promise<string>,
  ensureCategory: (name: string, type: "income" | "expense") => Promise<string>,
) {
  const db = await getDb();
  const type = mapType(row.type);
  if (!type) throw new Error(`Unknown TYPE "${row.type}"`);

  const amount = Number(row.amount);
  if (!(amount > 0) || Number.isNaN(amount)) {
    throw new Error(`Invalid AMOUNT "${row.amount}"`);
  }

  const occurred = toIsoLocal(parseCsvTime(row.time));
  const note = row.notes ?? "";
  const id = createId("rec");

  if (type === "transfer") {
    const { from, to } = parseTransferAccounts(row.account);
    const accountId = await ensureAccount(from);
    const toAccountId = await ensureAccount(to);
    if (accountId === toAccountId) {
      throw new Error("Transfer From and To are the same account");
    }
    await db.runAsync(
      `INSERT INTO records
         (id, type, amount, category_id, account_id, to_account_id, note, occurred_at)
       VALUES (?, 'transfer', ?, NULL, ?, ?, ?, ?)`,
      id,
      amount,
      accountId,
      toAccountId,
      note,
      occurred,
    );
    return;
  }

  if (!row.account.trim()) throw new Error("ACCOUNT is required");
  const accountId = await ensureAccount(row.account);
  let categoryId: string | null = null;
  if (!isBlankCategory(row.category)) {
    categoryId = await ensureCategory(row.category, type);
  }

  await db.runAsync(
    `INSERT INTO records
       (id, type, amount, category_id, account_id, to_account_id, note, occurred_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    id,
    type,
    amount,
    categoryId,
    accountId,
    note,
    occurred,
  );
}
