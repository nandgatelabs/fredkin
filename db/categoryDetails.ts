import { getCategoryBreakdown } from "./analysis";
import { getDb } from "./client";

function toIsoBound(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export type CategoryPeriodStats = {
  amount: number;
  percent: number;
  periodTotal: number;
  recordCount: number;
};

export async function getCategoryPeriodStats(
  categoryId: string,
  type: "expense" | "income",
  start: Date,
  end: Date,
): Promise<CategoryPeriodStats> {
  const db = await getDb();
  const [slices, countRow] = await Promise.all([
    getCategoryBreakdown(start, end, type),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM records
       WHERE category_id = ?
         AND occurred_at >= ? AND occurred_at <= ?`,
      categoryId,
      toIsoBound(start),
      toIsoBound(end),
    ),
  ]);

  const mine = slices.find((s) => s.categoryId === categoryId);
  const periodTotal = slices.reduce((s, r) => s + r.amount, 0);

  return {
    amount: mine?.amount ?? 0,
    percent: mine?.percent ?? 0,
    periodTotal,
    recordCount: countRow?.count ?? 0,
  };
}
