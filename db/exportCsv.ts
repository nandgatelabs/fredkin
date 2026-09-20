import {
  CSV_OPENING_TIME,
  CSV_TYPE_ADJUSTMENT_IN,
  CSV_TYPE_ADJUSTMENT_OUT,
  CSV_TYPE_EXPENSE,
  CSV_TYPE_INCOME,
  CSV_TYPE_OPENING,
  CSV_TYPE_TRANSFER,
  formatCsvAmount,
  serializeMoneyCsv,
  type CsvRow,
} from "@/lib/csv";
import { isAdjustmentFlag } from "@/lib/personRole";
import {
  formatComposerDate,
  formatComposerTime,
} from "@/lib/datetime";
import { parseOccurredAt } from "@/lib/recordsUi";

import { getDb } from "./client";
import type { Account, MoneyRecord } from "./types";

export type ExportCsvOptions = {
  /** Inclusive start of day (local). Null/undefined = no lower bound. */
  from?: Date | null;
  /** Inclusive end of day (local). Null/undefined = no upper bound. */
  to?: Date | null;
};

export type ExportCsvResult = {
  text: string;
  fileName: string;
  accountOpenings: number;
  records: number;
  fromLabel: string;
  toLabel: string;
};

/** Suggested download name — sync so the save picker can open on click. */
export function exportCsvFileName(now = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `fredkin-export_${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${String(now.getFullYear()).slice(-2)}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
}

function formatCsvTime(iso: string): string {
  const d = parseOccurredAt(iso);
  return `${formatComposerDate(d)} ${formatComposerTime(d)}`;
}

function typeLabel(record: MoneyRecord): string {
  if (isAdjustmentFlag(record.is_adjustment)) {
    return record.type === "income" ? CSV_TYPE_ADJUSTMENT_IN : CSV_TYPE_ADJUSTMENT_OUT;
  }
  if (record.type === "income") return CSV_TYPE_INCOME;
  if (record.type === "transfer") return CSV_TYPE_TRANSFER;
  return CSV_TYPE_EXPENSE;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Build a worksheet CSV including account opening balances (Fredkin extension). */
export async function exportMoneyCsv(
  options: ExportCsvOptions = {},
): Promise<ExportCsvResult> {
  const db = await getDb();
  const from = options.from ? startOfDay(options.from) : null;
  const to = options.to ? endOfDay(options.to) : null;

  const accounts = await db.getAllAsync<Account>(
    `SELECT * FROM accounts ORDER BY sort_order ASC, name ASC`,
  );

  const records = await db.getAllAsync<
    MoneyRecord & {
      category_name: string | null;
      account_name: string;
      to_account_name: string | null;
      person_name: string | null;
    }
  >(
    `SELECT
       r.*,
       c.name AS category_name,
       a.name AS account_name,
       ta.name AS to_account_name,
       p.name AS person_name
     FROM records r
     LEFT JOIN categories c ON c.id = r.category_id
     JOIN accounts a ON a.id = r.account_id
     LEFT JOIN accounts ta ON ta.id = r.to_account_id
     LEFT JOIN people p ON p.id = r.person_id
     ORDER BY r.occurred_at ASC, r.id ASC`,
  );

  const filtered = records.filter((record) => {
    const when = parseOccurredAt(record.occurred_at);
    if (from && when < from) return false;
    if (to && when > to) return false;
    return true;
  });

  const rows: CsvRow[] = [];

  for (const account of accounts) {
    rows.push({
      time: CSV_OPENING_TIME,
      type: CSV_TYPE_OPENING,
      amount: formatCsvAmount(account.opening_balance),
      category: "-",
      account: account.name,
      notes: "Opening balance",
      person: "",
      personRole: "",
    });
  }

  for (const record of filtered) {
    const accountField =
      record.type === "transfer"
        ? `${record.account_name}->${record.to_account_name ?? "?"}`
        : record.account_name;
    rows.push({
      time: formatCsvTime(record.occurred_at),
      type: typeLabel(record),
      amount: formatCsvAmount(record.amount),
      category:
        record.type === "transfer" || isAdjustmentFlag(record.is_adjustment)
          ? "-"
          : (record.category_name?.trim() || "-"),
      account: accountField,
      notes: record.note ?? "",
      person: record.person_name?.trim() ?? "",
      personRole: record.person_role ?? "",
    });
  }

  if (rows.length === 0) {
    throw new Error("Nothing to export — add an account or record first");
  }

  return {
    text: serializeMoneyCsv(rows),
    fileName: exportCsvFileName(),
    accountOpenings: accounts.length,
    records: filtered.length,
    fromLabel: from ? formatComposerDate(from) : "All time",
    toLabel: to ? formatComposerDate(to) : "All time",
  };
}
