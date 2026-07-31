import { createId } from "@/lib/id";

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
};

function validateRecordInput(input: CreateRecordInput): void {
  if (!(input.amount > 0) || Number.isNaN(input.amount)) {
    throw new Error("Amount must be greater than 0");
  }
  if (!input.account_id) {
    throw new Error("Account is required");
  }
  if (input.type === "transfer") {
    if (!input.to_account_id) {
      throw new Error("Destination account is required");
    }
    if (input.to_account_id === input.account_id) {
      throw new Error("From and To accounts must be different");
    }
  } else if (!input.category_id) {
    throw new Error("Category is required");
  }
}

export async function createRecord(input: CreateRecordInput): Promise<MoneyRecord> {
  validateRecordInput(input);
  const db = await getDb();
  const id = createId("rec");
  const note = input.note?.trim() ?? "";
  const categoryId = input.type === "transfer" ? null : (input.category_id ?? null);
  const toAccountId = input.type === "transfer" ? (input.to_account_id ?? null) : null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO records
         (id, type, amount, category_id, account_id, to_account_id, note, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.type,
      input.amount,
      categoryId,
      input.account_id,
      toAccountId,
      note,
      input.occurred_at,
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
  };
}

export async function getRecord(id: string): Promise<MoneyRecord | null> {
  const db = await getDb();
  return db.getFirstAsync<MoneyRecord>("SELECT * FROM records WHERE id = ?", id);
}

export async function countRecords(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM records",
  );
  return row?.count ?? 0;
}
