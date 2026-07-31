import { createId } from "@/lib/id";

import { getDb } from "./client";
import type { Account, AccountWithBalance, Totals } from "./types";

async function listAccountsByArchived(archived: 0 | 1): Promise<AccountWithBalance[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Account>(
    `SELECT * FROM accounts WHERE archived = ? ORDER BY sort_order ASC, name ASC`,
    archived,
  );

  const result: AccountWithBalance[] = [];
  for (const account of rows) {
    const balance = await computeAccountBalance(account.id, account.opening_balance);
    result.push({ ...account, balance });
  }
  return result;
}

export async function listAccounts(): Promise<AccountWithBalance[]> {
  return listAccountsByArchived(0);
}

export async function listIgnoredAccounts(): Promise<AccountWithBalance[]> {
  return listAccountsByArchived(1);
}

export async function computeAccountBalance(
  accountId: string,
  openingBalance: number,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ delta: number | null }>(
    `SELECT COALESCE(SUM(
       CASE
         WHEN type = 'income' AND account_id = ? THEN amount
         WHEN type = 'expense' AND account_id = ? THEN -amount
         WHEN type = 'transfer' AND account_id = ? THEN -amount
         WHEN type = 'transfer' AND to_account_id = ? THEN amount
         ELSE 0
       END
     ), 0) AS delta
     FROM records
     WHERE account_id = ? OR to_account_id = ?`,
    accountId,
    accountId,
    accountId,
    accountId,
    accountId,
    accountId,
  );
  return openingBalance + (row?.delta ?? 0);
}

export async function getLifetimeTotals(): Promise<Totals> {
  const db = await getDb();
  const sums = await db.getFirstAsync<{ expense: number; income: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
     FROM records`,
  );

  const accounts = await listAccounts();
  const allAccountsBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return {
    expenseSoFar: sums?.expense ?? 0,
    incomeSoFar: sums?.income ?? 0,
    allAccountsBalance,
  };
}

export async function createAccount(input: {
  name: string;
  icon_key?: string;
  opening_balance?: number;
}): Promise<Account> {
  const db = await getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Account name is required");

  const max = await db.getFirstAsync<{ m: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) AS m FROM accounts",
  );
  const id = createId("acc");
  const icon_key = input.icon_key ?? "wallet";
  const opening_balance = input.opening_balance ?? 0;
  const sort_order = (max?.m ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO accounts (id, name, icon_key, opening_balance, sort_order, archived)
     VALUES (?, ?, ?, ?, ?, 0)`,
    id,
    name,
    icon_key,
    opening_balance,
    sort_order,
  );

  return {
    id,
    name,
    icon_key,
    opening_balance,
    sort_order,
    archived: 0,
  };
}

export async function updateAccount(
  id: string,
  input: { name?: string; icon_key?: string; opening_balance?: number },
): Promise<void> {
  const db = await getDb();
  const current = await db.getFirstAsync<Account>(
    "SELECT * FROM accounts WHERE id = ?",
    id,
  );
  if (!current) throw new Error("Account not found");

  await db.runAsync(
    `UPDATE accounts SET name = ?, icon_key = ?, opening_balance = ? WHERE id = ?`,
    input.name?.trim() || current.name,
    input.icon_key ?? current.icon_key,
    input.opening_balance ?? current.opening_balance,
    id,
  );
}

export async function countAccountRecords(id: string): Promise<number> {
  const db = await getDb();
  const usage = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM records
     WHERE account_id = ? OR to_account_id = ?`,
    id,
    id,
  );
  return usage?.count ?? 0;
}

/** Deletes the account and every record that uses it (as from or to). */
export async function deleteAccount(id: string): Promise<{ deletedRecords: number }> {
  const db = await getDb();
  const deletedRecords = await countAccountRecords(id);
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM records WHERE account_id = ? OR to_account_id = ?`,
      id,
      id,
    );
    const result = await db.runAsync("DELETE FROM accounts WHERE id = ?", id);
    if ((result.changes ?? 0) === 0) {
      throw new Error("Account not found");
    }
  });
  return { deletedRecords };
}

export async function archiveAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE accounts SET archived = 1 WHERE id = ?", id);
}

export async function restoreAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE accounts SET archived = 0 WHERE id = ?", id);
}
