import { createId } from "@/lib/id";
import { isLifestyleRole, isPersonRole, sqlLifestyle, type PersonRole } from "@/lib/personRole";

import { getDb } from "./client";
import type { MoneyRecord, RecordType } from "./types";

export type CreateRecordInput = {
  type: RecordType;
  amount: number;
  account_id: string;
  category_id?: string | null;
  to_account_id?: string | null;
  note?: string;
  occurred_at: string;
  person_id?: string | null;
  person_role?: PersonRole | null;
  is_adjustment?: boolean;
  occasion_id?: string | null;
};

export type RecordListItem = MoneyRecord & {
  category_name: string | null;
  category_icon_key: string | null;
  category_color: string | null;
  account_name: string;
  account_icon_key: string;
  to_account_name: string | null;
  person_name: string | null;
  occasion_title: string | null;
};

export type PeriodTotals = {
  expense: number;
  income: number;
};

function validateRecordInput(input: CreateRecordInput): void {
  if (!(input.amount > 0) || Number.isNaN(input.amount)) {
    throw new Error("Amount must be greater than 0");
  }
  if (!input.account_id) {
    throw new Error("Account is required");
  }
  if (input.is_adjustment) {
    if (input.type === "transfer") {
      throw new Error("Adjustments cannot be transfers");
    }
    return;
  }
  if (input.type === "transfer") {
    if (!input.to_account_id) {
      throw new Error("Destination account is required");
    }
    if (input.to_account_id === input.account_id) {
      throw new Error("From and To accounts must be different");
    }
  }
  const role = input.person_id ? input.person_role ?? "with" : null;
  if (input.person_id && role && !isPersonRole(role)) {
    throw new Error("Invalid person role");
  }
  if (input.type === "transfer" && role && !isLifestyleRole(role)) {
    throw new Error("IOU roles are only for spend or income");
  }
}

function toIsoBound(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export async function createRecord(input: CreateRecordInput): Promise<MoneyRecord> {
  validateRecordInput(input);
  const db = await getDb();
  const id = createId("rec");
  const note = input.note?.trim() ?? "";
  const isAdj = !!input.is_adjustment;
  const categoryId = input.type === "transfer" || isAdj ? null : (input.category_id ?? null);
  const toAccountId = input.type === "transfer" ? (input.to_account_id ?? null) : null;
  const personId = isAdj ? null : (input.person_id ?? null);
  const personRole = personId
    ? input.type === "transfer" && !isLifestyleRole(input.person_role)
      ? "with"
      : (input.person_role ?? "with")
    : null;
  const occasionId = isAdj ? null : (input.occasion_id ?? null);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO records
         (id, type, amount, category_id, account_id, to_account_id, note, occurred_at, person_id, person_role, is_adjustment, occasion_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.type,
      input.amount,
      categoryId,
      input.account_id,
      toAccountId,
      note,
      input.occurred_at,
      personId,
      personRole,
      isAdj ? 1 : 0,
      occasionId,
    );
  });

  return {
    id,
    type: input.type,
    amount: input.amount,
    category_id: categoryId,
    account_id: input.account_id,
    to_account_id: toAccountId,
    note,
    occurred_at: input.occurred_at,
    person_id: personId,
    person_role: personRole,
    is_adjustment: isAdj ? 1 : 0,
    occasion_id: occasionId,
  };
}

export async function updateRecord(
  id: string,
  input: CreateRecordInput,
): Promise<void> {
  validateRecordInput(input);
  const db = await getDb();
  const note = input.note?.trim() ?? "";
  const isAdj = !!input.is_adjustment;
  const categoryId = input.type === "transfer" || isAdj ? null : (input.category_id ?? null);
  const toAccountId = input.type === "transfer" ? (input.to_account_id ?? null) : null;
  const personId = isAdj ? null : (input.person_id ?? null);
  const personRole = personId
    ? input.type === "transfer" && !isLifestyleRole(input.person_role)
      ? "with"
      : (input.person_role ?? "with")
    : null;

  const existing = await db.getFirstAsync<{ occasion_id: string | null }>(
    "SELECT occasion_id FROM records WHERE id = ?",
    id,
  );
  if (!existing) throw new Error("Record not found");
  const occasionId =
    input.occasion_id !== undefined
      ? input.occasion_id
      : existing.occasion_id;

  const result = await db.runAsync(
    `UPDATE records SET
       type = ?, amount = ?, category_id = ?, account_id = ?,
       to_account_id = ?, note = ?, occurred_at = ?, person_id = ?, person_role = ?, is_adjustment = ?, occasion_id = ?
     WHERE id = ?`,
    input.type,
    input.amount,
    categoryId,
    input.account_id,
    toAccountId,
    note,
    input.occurred_at,
    personId,
    personRole,
    isAdj ? 1 : 0,
    isAdj ? null : occasionId,
    id,
  );
  if (result.changes === 0) throw new Error("Record not found");
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDb();
  const result = await db.runAsync("DELETE FROM records WHERE id = ?", id);
  if (result.changes === 0) throw new Error("Record not found");
}

export async function getRecord(id: string): Promise<MoneyRecord | null> {
  const db = await getDb();
  return db.getFirstAsync<MoneyRecord>("SELECT * FROM records WHERE id = ?", id);
}

export async function getRecordListItem(id: string): Promise<RecordListItem | null> {
  const db = await getDb();
  return db.getFirstAsync<RecordListItem>(
    `${LIST_SELECT} WHERE r.id = ?`,
    id,
  );
}

const LIST_SELECT = `
SELECT
  r.*,
  c.name AS category_name,
  c.icon_key AS category_icon_key,
  c.color AS category_color,
  a.name AS account_name,
  a.icon_key AS account_icon_key,
  ta.name AS to_account_name,
  p.name AS person_name,
  o.title AS occasion_title
FROM records r
LEFT JOIN categories c ON c.id = r.category_id
JOIN accounts a ON a.id = r.account_id
LEFT JOIN accounts ta ON ta.id = r.to_account_id
LEFT JOIN people p ON p.id = r.person_id
LEFT JOIN occasions o ON o.id = r.occasion_id
`;

export async function listRecordsInRange(
  start: Date,
  end: Date,
): Promise<RecordListItem[]> {
  const db = await getDb();
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE r.occurred_at >= ? AND r.occurred_at <= ?
     ORDER BY r.occurred_at DESC, r.id DESC`,
    toIsoBound(start),
    toIsoBound(end),
  );
}

/** Records touching an account (as from or to). Optional date range. */
export async function listRecordsForAccount(
  accountId: string,
  range?: { start: Date; end: Date },
): Promise<RecordListItem[]> {
  const db = await getDb();
  if (range) {
    return db.getAllAsync<RecordListItem>(
      `${LIST_SELECT}
       WHERE (r.account_id = ? OR r.to_account_id = ?)
         AND r.occurred_at >= ? AND r.occurred_at <= ?
       ORDER BY r.occurred_at DESC, r.id DESC`,
      accountId,
      accountId,
      toIsoBound(range.start),
      toIsoBound(range.end),
    );
  }
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE r.account_id = ? OR r.to_account_id = ?
     ORDER BY r.occurred_at DESC, r.id DESC`,
    accountId,
    accountId,
  );
}

/** Records in a category. Optional date range. */
export async function listRecordsForCategory(
  categoryId: string,
  range?: { start: Date; end: Date },
): Promise<RecordListItem[]> {
  const db = await getDb();
  if (range) {
    return db.getAllAsync<RecordListItem>(
      `${LIST_SELECT}
       WHERE r.category_id = ?
         AND r.occurred_at >= ? AND r.occurred_at <= ?
       ORDER BY r.occurred_at DESC, r.id DESC`,
      categoryId,
      toIsoBound(range.start),
      toIsoBound(range.end),
    );
  }
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE r.category_id = ?
     ORDER BY r.occurred_at DESC, r.id DESC`,
    categoryId,
  );
}

export async function listRecordsForPerson(
  personId: string,
): Promise<RecordListItem[]> {
  const db = await getDb();
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE r.person_id = ?
     ORDER BY r.occurred_at DESC, r.id DESC`,
    personId,
  );
}

export async function getPeriodTotals(start: Date, end: Date): Promise<PeriodTotals> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ expense: number; income: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
     FROM records
     WHERE occurred_at >= ? AND occurred_at <= ?
       AND ${sqlLifestyle()}`,
    toIsoBound(start),
    toIsoBound(end),
  );
  return {
    expense: row?.expense ?? 0,
    income: row?.income ?? 0,
  };
}

/** Net (income − expense) for all records strictly before `before`. Transfers ignored. */
export async function getCarryOverBefore(before: Date): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ net: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS net
     FROM records
     WHERE occurred_at < ?
       AND type IN ('income', 'expense')
       AND ${sqlLifestyle()}`,
    toIsoBound(before),
  );
  return row?.net ?? 0;
}

export async function countRecords(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM records",
  );
  return row?.count ?? 0;
}

/** Case-insensitive substring search on note, category, or account names. */
export async function searchRecords(query: string): Promise<RecordListItem[]> {
  const q = query.trim();
  if (!q) return [];
  const db = await getDb();
  const like = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE
       r.note LIKE ? COLLATE NOCASE ESCAPE '\\'
       OR IFNULL(c.name, '') LIKE ? COLLATE NOCASE ESCAPE '\\'
       OR a.name LIKE ? COLLATE NOCASE ESCAPE '\\'
       OR IFNULL(ta.name, '') LIKE ? COLLATE NOCASE ESCAPE '\\'
       OR IFNULL(p.name, '') LIKE ? COLLATE NOCASE ESCAPE '\\'
       OR IFNULL(o.title, '') LIKE ? COLLATE NOCASE ESCAPE '\\'
     ORDER BY r.occurred_at DESC, r.id DESC
     LIMIT 500`,
    like,
    like,
    like,
    like,
    like,
    like,
  );
}

export async function listUngroupedRecordsInRange(
  start: Date,
  end: Date,
): Promise<RecordListItem[]> {
  const db = await getDb();
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE r.occurred_at >= ? AND r.occurred_at <= ?
       AND r.occasion_id IS NULL
       AND IFNULL(r.is_adjustment, 0) = 0
     ORDER BY r.occurred_at DESC, r.id DESC`,
    toIsoBound(start),
    toIsoBound(end),
  );
}

export async function listRecordsForOccasion(
  occasionId: string,
): Promise<RecordListItem[]> {
  const db = await getDb();
  return db.getAllAsync<RecordListItem>(
    `${LIST_SELECT}
     WHERE r.occasion_id = ?
     ORDER BY r.occurred_at ASC, r.id ASC`,
    occasionId,
  );
}
