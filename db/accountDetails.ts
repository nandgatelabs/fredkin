import { getDb } from "./client";
import { computeAccountBalance } from "./accounts";
import { getPeriodTotals } from "./records";
import type { Account } from "./types";

function toIsoBound(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export async function getAccount(id: string): Promise<Account | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Account>("SELECT * FROM accounts WHERE id = ?", id);
  if (!row) return null;
  return {
    ...row,
    last_checked_balance:
      row.last_checked_balance == null ? null : Number(row.last_checked_balance),
    last_checked_at: row.last_checked_at ?? null,
  };
}

async function ledgerDelta(
  accountId: string,
  opts: { before?: Date; through?: Date },
): Promise<number> {
  const db = await getDb();
  const clauses = ["(account_id = ? OR to_account_id = ?)"];
  const caseParams = [accountId, accountId, accountId, accountId];
  const whereParams: string[] = [accountId, accountId];

  if (opts.before) {
    clauses.push("occurred_at < ?");
    whereParams.push(toIsoBound(opts.before));
  }
  if (opts.through) {
    clauses.push("occurred_at <= ?");
    whereParams.push(toIsoBound(opts.through));
  }

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
     WHERE ${clauses.join(" AND ")}`,
    ...caseParams,
    ...whereParams,
  );
  return row?.delta ?? 0;
}

export type AccountPeriodStats = {
  startingBalance: number;
  endingBalance: number;
  currentBalance: number;
  expense: number;
  income: number;
  transferIn: number;
  transferOut: number;
  expensePercent: number;
  incomePercent: number;
};

export async function getAccountPeriodStats(
  accountId: string,
  openingBalance: number,
  start: Date,
  end: Date,
): Promise<AccountPeriodStats> {
  const db = await getDb();
  const startIso = toIsoBound(start);
  const endIso = toIsoBound(end);

  const [beforeDelta, throughDelta, flow, periodTotals, currentBalance] =
    await Promise.all([
      ledgerDelta(accountId, { before: start }),
      ledgerDelta(accountId, { through: end }),
      db.getFirstAsync<{
        expense: number;
        income: number;
        transfer_in: number;
        transfer_out: number;
      }>(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'expense' AND account_id = ? AND IFNULL(is_adjustment, 0) = 0 THEN amount ELSE 0 END), 0) AS expense,
           COALESCE(SUM(CASE WHEN type = 'income' AND account_id = ? AND IFNULL(is_adjustment, 0) = 0 THEN amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN type = 'transfer' AND to_account_id = ? THEN amount ELSE 0 END), 0) AS transfer_in,
           COALESCE(SUM(CASE WHEN type = 'transfer' AND account_id = ? THEN amount ELSE 0 END), 0) AS transfer_out
         FROM records
         WHERE (account_id = ? OR to_account_id = ?)
           AND occurred_at >= ? AND occurred_at <= ?`,
        accountId,
        accountId,
        accountId,
        accountId,
        accountId,
        accountId,
        startIso,
        endIso,
      ),
      getPeriodTotals(start, end),
      computeAccountBalance(accountId, openingBalance),
    ]);

  const expense = flow?.expense ?? 0;
  const income = flow?.income ?? 0;

  return {
    startingBalance: openingBalance + beforeDelta,
    endingBalance: openingBalance + throughDelta,
    currentBalance,
    expense,
    income,
    transferIn: flow?.transfer_in ?? 0,
    transferOut: flow?.transfer_out ?? 0,
    expensePercent:
      periodTotals.expense > 0 ? (expense / periodTotals.expense) * 100 : 0,
    incomePercent:
      periodTotals.income > 0 ? (income / periodTotals.income) * 100 : 0,
  };
}
