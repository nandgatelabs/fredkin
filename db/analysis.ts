import { getDb } from "./client";

function toIsoBound(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export type CategorySlice = {
  categoryId: string | null;
  name: string;
  iconKey: string;
  color: string | null;
  amount: number;
  percent: number;
};

export type DayTotal = {
  /** YYYY-MM-DD local */
  day: string;
  amount: number;
};

export type AccountPeriodSlice = {
  accountId: string;
  name: string;
  iconKey: string;
  expense: number;
  income: number;
};

export async function getCategoryBreakdown(
  start: Date,
  end: Date,
  type: "expense" | "income",
): Promise<CategorySlice[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    category_id: string | null;
    name: string | null;
    icon_key: string | null;
    color: string | null;
    amount: number;
  }>(
    `SELECT
       r.category_id,
       c.name,
       c.icon_key,
       c.color,
       COALESCE(SUM(r.amount), 0) AS amount
     FROM records r
     LEFT JOIN categories c ON c.id = r.category_id
     WHERE r.type = ?
       AND r.occurred_at >= ?
       AND r.occurred_at <= ?
     GROUP BY r.category_id
     ORDER BY amount DESC`,
    type,
    toIsoBound(start),
    toIsoBound(end),
  );

  const total = rows.reduce((s, r) => s + r.amount, 0);
  return rows.map((r) => ({
    categoryId: r.category_id,
    name: r.name?.trim() || "Uncategorized",
    iconKey: r.icon_key ?? "pricetag",
    color: r.color,
    amount: r.amount,
    percent: total > 0 ? (r.amount / total) * 100 : 0,
  }));
}

export async function getDailyTotals(
  start: Date,
  end: Date,
  type: "expense" | "income",
): Promise<DayTotal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string; amount: number }>(
    `SELECT
       substr(r.occurred_at, 1, 10) AS day,
       COALESCE(SUM(r.amount), 0) AS amount
     FROM records r
     WHERE r.type = ?
       AND r.occurred_at >= ?
       AND r.occurred_at <= ?
     GROUP BY substr(r.occurred_at, 1, 10)
     ORDER BY day ASC`,
    type,
    toIsoBound(start),
    toIsoBound(end),
  );
  return rows;
}

export async function getAccountPeriodBreakdown(
  start: Date,
  end: Date,
): Promise<AccountPeriodSlice[]> {
  const db = await getDb();
  const startIso = toIsoBound(start);
  const endIso = toIsoBound(end);
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    icon_key: string;
    expense: number;
    income: number;
  }>(
    `SELECT
       a.id,
       a.name,
       a.icon_key,
       COALESCE((
         SELECT SUM(r.amount) FROM records r
         WHERE r.type = 'expense' AND r.account_id = a.id
           AND r.occurred_at >= ? AND r.occurred_at <= ?
       ), 0) AS expense,
       COALESCE((
         SELECT SUM(r.amount) FROM records r
         WHERE r.type = 'income' AND r.account_id = a.id
           AND r.occurred_at >= ? AND r.occurred_at <= ?
       ), 0) AS income
     FROM accounts a
     WHERE a.archived = 0
     ORDER BY a.sort_order ASC, a.name ASC`,
    startIso,
    endIso,
    startIso,
    endIso,
  );

  return rows
    .filter((r) => r.expense > 0 || r.income > 0)
    .map((r) => ({
      accountId: r.id,
      name: r.name,
      iconKey: r.icon_key,
      expense: r.expense,
      income: r.income,
    }));
}
