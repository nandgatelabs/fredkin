import type { RecordListItem } from "@/db/records";
import { isAdjustmentFlag } from "@/lib/personRole";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function parseOccurredAt(iso: string): Date {
  // Support both "YYYY-MM-DDTHH:mm:ss" and full ISO.
  const d = new Date(iso);
  if (!Number.isNaN(d.getTime())) return d;
  const [datePart, timePart = "00:00:00"] = iso.split("T");
  const [y, m, day] = datePart.split("-").map(Number);
  const [hh, mm, ss] = timePart.split(":").map(Number);
  return new Date(y, m - 1, day, hh || 0, mm || 0, ss || 0);
}

export function formatDateSectionHeader(iso: string): string {
  const d = parseOccurredAt(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${WEEKDAYS[d.getDay()]}`;
}

export function dateKey(iso: string): string {
  const d = parseOccurredAt(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function groupRecordsByDate(records: RecordListItem[]) {
  const sections: { title: string; key: string; data: RecordListItem[] }[] = [];
  const map = new Map<string, RecordListItem[]>();

  for (const r of records) {
    const key = dateKey(r.occurred_at);
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }

  for (const [key, data] of map) {
    sections.push({
      key,
      title: formatDateSectionHeader(data[0].occurred_at),
      data,
    });
  }
  return sections;
}

export function recordTitle(item: RecordListItem): string {
  if (isAdjustmentFlag(item.is_adjustment)) return "Adjustment";
  if (item.type === "transfer") {
    return `${item.account_name} → ${item.to_account_name ?? "?"}`;
  }
  return item.category_name ?? "Uncategorized";
}

export function signedDisplayAmount(item: RecordListItem): number {
  if (item.type === "expense") return -item.amount;
  if (item.type === "income") return item.amount;
  return item.amount; // transfer shown unsigned blue
}
