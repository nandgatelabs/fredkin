import { createId } from "@/lib/id";
import { sqlLifestyle } from "@/lib/personRole";

import { getDb } from "./client";

export type BudgetRow = {
  id: string;
  category_id: string;
  year: number;
  month: number;
  limit_amount: number;
  category_name: string;
  category_icon_key: string;
  category_color: string | null;
  spent: number;
};

export type BudgetTotals = {
  totalBudget: number;
  totalSpent: number;
};

function monthBounds(year: number, month: number) {
  // month is 1–12
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { startIso: toIso(start), endIso: toIso(end) };
}

export async function listBudgetsForMonth(
  year: number,
  month: number,
): Promise<BudgetRow[]> {
  const db = await getDb();
  const { startIso, endIso } = monthBounds(year, month);
  return db.getAllAsync<BudgetRow>(
    `SELECT
       b.id,
       b.category_id,
       b.year,
       b.month,
       b.limit_amount,
       c.name AS category_name,
       c.icon_key AS category_icon_key,
       c.color AS category_color,
       COALESCE((
         SELECT SUM(r.amount) FROM records r
         WHERE r.type = 'expense'
           AND r.category_id = b.category_id
           AND r.occurred_at >= ?
           AND r.occurred_at <= ?
           AND ${sqlLifestyle("r")}
       ), 0) AS spent
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     WHERE b.year = ? AND b.month = ?
       AND c.archived = 0
       AND c.type = 'expense'
     ORDER BY c.sort_order ASC, c.name ASC`,
    startIso,
    endIso,
    year,
    month,
  );
}

export async function getBudgetTotals(
  year: number,
  month: number,
): Promise<BudgetTotals> {
  const rows = await listBudgetsForMonth(year, month);
  return {
    totalBudget: rows.reduce((s, r) => s + r.limit_amount, 0),
    totalSpent: rows.reduce((s, r) => s + r.spent, 0),
  };
}

/** Expense categories with no budget row for this month. */
export async function listUnbudgetedExpenseCategories(
  year: number,
  month: number,
): Promise<
  {
    id: string;
    name: string;
    icon_key: string;
    color: string | null;
  }[]
> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT c.id, c.name, c.icon_key, c.color
     FROM categories c
     WHERE c.archived = 0
       AND c.type = 'expense'
       AND c.id NOT IN (
         SELECT category_id FROM budgets WHERE year = ? AND month = ?
       )
     ORDER BY c.sort_order ASC, c.name ASC`,
    year,
    month,
  );
}

export async function setBudget(
  categoryId: string,
  year: number,
  month: number,
  limitAmount: number,
): Promise<void> {
  if (!(limitAmount >= 0) || Number.isNaN(limitAmount)) {
    throw new Error("Budget limit must be zero or greater");
  }
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM budgets WHERE category_id = ? AND year = ? AND month = ?`,
    categoryId,
    year,
    month,
  );
  if (existing) {
    await db.runAsync(
      `UPDATE budgets SET limit_amount = ? WHERE id = ?`,
      limitAmount,
      existing.id,
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO budgets (id, category_id, year, month, limit_amount)
     VALUES (?, ?, ?, ?, ?)`,
    createId("bud"),
    categoryId,
    year,
    month,
    limitAmount,
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM budgets WHERE id = ?`, id);
}

/** Copy all budgets from one month onto another (overwrite matching categories). */
export async function copyBudgetsFromMonth(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): Promise<number> {
  const db = await getDb();
  const source = await db.getAllAsync<{
    category_id: string;
    limit_amount: number;
  }>(
    `SELECT category_id, limit_amount FROM budgets WHERE year = ? AND month = ?`,
    fromYear,
    fromMonth,
  );
  if (source.length === 0) return 0;

  await db.withTransactionAsync(async () => {
    for (const row of source) {
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM budgets WHERE category_id = ? AND year = ? AND month = ?`,
        row.category_id,
        toYear,
        toMonth,
      );
      if (existing) {
        await db.runAsync(
          `UPDATE budgets SET limit_amount = ? WHERE id = ?`,
          row.limit_amount,
          existing.id,
        );
      } else {
        await db.runAsync(
          `INSERT INTO budgets (id, category_id, year, month, limit_amount)
           VALUES (?, ?, ?, ?, ?)`,
          createId("bud"),
          row.category_id,
          toYear,
          toMonth,
          row.limit_amount,
        );
      }
    }
  });
  return source.length;
}
