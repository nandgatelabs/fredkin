import { getDb } from "./client";
import { seedDefaultsIfEmpty } from "./seed";
import type { Account, Budget, Category, MoneyRecord, Person } from "./types";

export type MoneyBackup = {
  version: 1 | 2 | 3;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  people?: Person[];
  records: MoneyRecord[];
  budgets: Budget[];
  settings: { key: string; value: string }[];
};

export async function createBackupPayload(): Promise<MoneyBackup> {
  const db = await getDb();
  const [accounts, categories, people, records, budgets, settings] = await Promise.all([
    db.getAllAsync<Account>(`SELECT * FROM accounts ORDER BY sort_order, name`),
    db.getAllAsync<Category>(`SELECT * FROM categories ORDER BY type, sort_order, name`),
    db.getAllAsync<Person>(`SELECT * FROM people ORDER BY name`),
    db.getAllAsync<MoneyRecord>(`SELECT * FROM records ORDER BY occurred_at, id`),
    db.getAllAsync<Budget>(`SELECT * FROM budgets ORDER BY year, month, category_id`),
    db.getAllAsync<{ key: string; value: string }>(`SELECT key, value FROM settings`),
  ]);
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    accounts,
    categories,
    people,
    records,
    budgets,
    settings,
  };
}

export function backupFileName() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `fredkin-backup_${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${String(now.getFullYear()).slice(-2)}_${pad(now.getHours())}${pad(now.getMinutes())}.mbak`;
}

export async function restoreBackupPayload(payload: MoneyBackup): Promise<void> {
  if (payload.version !== 1 && payload.version !== 2 && payload.version !== 3) {
    throw new Error(`Unsupported backup version: ${String(payload.version)}`);
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM budgets");
    await db.runAsync("DELETE FROM records");
    await db.runAsync("DELETE FROM people");
    await db.runAsync("DELETE FROM categories");
    await db.runAsync("DELETE FROM accounts");
    await db.runAsync("DELETE FROM settings");

    for (const a of payload.accounts ?? []) {
      await db.runAsync(
        `INSERT INTO accounts (id, name, icon_key, opening_balance, sort_order, archived, last_checked_balance, last_checked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        a.id,
        a.name,
        a.icon_key,
        a.opening_balance,
        a.sort_order,
        a.archived ?? 0,
        a.last_checked_balance ?? null,
        a.last_checked_at ?? null,
      );
    }
    for (const c of payload.categories ?? []) {
      await db.runAsync(
        `INSERT INTO categories (id, name, type, icon_key, color, sort_order, archived)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        c.id,
        c.name,
        c.type,
        c.icon_key,
        c.color,
        c.sort_order,
        c.archived ?? 0,
      );
    }
    for (const p of payload.people ?? []) {
      await db.runAsync(
        `INSERT INTO people (id, name, note, archived, converted_from_account_id)
         VALUES (?, ?, ?, ?, ?)`,
        p.id,
        p.name,
        p.note ?? "",
        p.archived ?? 0,
        p.converted_from_account_id ?? null,
      );
    }
    for (const r of payload.records ?? []) {
      await db.runAsync(
        `INSERT INTO records
           (id, type, amount, category_id, account_id, to_account_id, note, occurred_at, person_id, person_role, is_adjustment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id,
        r.type,
        r.amount,
        r.category_id,
        r.account_id,
        r.to_account_id,
        r.note ?? "",
        r.occurred_at,
        r.person_id ?? null,
        r.person_role ?? null,
        r.is_adjustment ? 1 : 0,
      );
    }
    for (const b of payload.budgets ?? []) {
      await db.runAsync(
        `INSERT INTO budgets (id, category_id, year, month, limit_amount)
         VALUES (?, ?, ?, ?, ?)`,
        b.id,
        b.category_id,
        b.year,
        b.month,
        b.limit_amount,
      );
    }
    for (const s of payload.settings ?? []) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)`,
        s.key,
        s.value,
      );
    }
  });
}

export type WipeMode = "records" | "all_data" | "factory";

export async function wipeData(mode: WipeMode): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    if (mode === "records") {
      await db.runAsync("DELETE FROM records");
      return;
    }
    await db.runAsync("DELETE FROM budgets");
    await db.runAsync("DELETE FROM records");
    await db.runAsync("DELETE FROM people");
    await db.runAsync("DELETE FROM categories");
    await db.runAsync("DELETE FROM accounts");
    if (mode === "factory") {
      await db.runAsync("DELETE FROM settings");
    }
  });
  if (mode === "factory" || mode === "all_data") {
    await seedDefaultsIfEmpty(db);
  }
}
