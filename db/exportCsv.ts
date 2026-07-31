import {
  CSV_OPENING_TIME,
  CSV_TYPE_EXPENSE,
  CSV_TYPE_INCOME,
  CSV_TYPE_OPENING,
  CSV_TYPE_TRANSFER,
  formatCsvAmount,
  serializeMoneyCsv,
  type CsvRow,
} from "@/lib/csv";
import {
  formatComposerDate,
  formatComposerTime,
} from "@/lib/datetime";
import { parseOccurredAt } from "@/lib/recordsUi";

import { getDb } from "./client";
import type { Account, MoneyRecord } from "./types";

export type ExportCsvResult = {
  text: string;
  fileName: string;
  accountOpenings: number;
  records: number;
};

/** Suggested download name — sync so the save picker can open on click. */
export function exportCsvFileName(now = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `money-money-export_${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${String(now.getFullYear()).slice(-2)}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
}

function formatCsvTime(iso: string): string {
  const d = parseOccurredAt(iso);
  return `${formatComposerDate(d)} ${formatComposerTime(d)}`;
}

function typeLabel(type: MoneyRecord["type"]): string {
  if (type === "income") return CSV_TYPE_INCOME;
  if (type === "transfer") return CSV_TYPE_TRANSFER;
  return CSV_TYPE_EXPENSE;
}

/** Build a worksheet CSV including account opening balances (money-money extension). */
export async function exportMoneyCsv(): Promise<ExportCsvResult> {
  const db = await getDb();

  const accounts = await db.getAllAsync<Account>(
    `SELECT * FROM accounts ORDER BY sort_order ASC, name ASC`,
  );

  const records = await db.getAllAsync<
    MoneyRecord & {
      category_name: string | null;
      account_name: string;
      to_account_name: string | null;
    }
  >(
    `SELECT
       r.*,
       c.name AS category_name,
       a.name AS account_name,
       ta.name AS to_account_name
     FROM records r
     LEFT JOIN categories c ON c.id = r.category_id
     JOIN accounts a ON a.id = r.account_id
     LEFT JOIN accounts ta ON ta.id = r.to_account_id
     ORDER BY r.occurred_at ASC, r.id ASC`,
  );

  const rows: CsvRow[] = [];

  for (const account of accounts) {
    rows.push({
      time: CSV_OPENING_TIME,
      type: CSV_TYPE_OPENING,
      amount: formatCsvAmount(account.opening_balance),
      category: "-",
      account: account.name,
      notes: "Opening balance",
    });
  }

  for (const record of records) {
    const accountField =
      record.type === "transfer"
        ? `${record.account_name}->${record.to_account_name ?? "?"}`
        : record.account_name;
    rows.push({
      time: formatCsvTime(record.occurred_at),
      type: typeLabel(record.type),
      amount: formatCsvAmount(record.amount),
      category:
        record.type === "transfer" ? "-" : (record.category_name?.trim() || "-"),
      account: accountField,
      notes: record.note ?? "",
    });
  }

  if (rows.length === 0) {
    throw new Error("Nothing to export — add an account or record first");
  }

  return {
    text: serializeMoneyCsv(rows),
    fileName: exportCsvFileName(),
    accountOpenings: accounts.length,
    records: records.length,
  };
}
