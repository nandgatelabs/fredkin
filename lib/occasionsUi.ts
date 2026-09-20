import type { RecordListItem } from "@/db/records";
import type { Occasion } from "@/db/types";
import { dateKey, formatDateSectionHeader, parseOccurredAt } from "@/lib/recordsUi";
import { isAdjustmentFlag, isLifestyleRole } from "@/lib/personRole";

export type OccasionListRow = {
  kind: "occasion";
  occasion: Occasion;
  members: RecordListItem[];
  expense: number;
  income: number;
};

export type EventListRow =
  | { kind: "record"; item: RecordListItem }
  | OccasionListRow;

export function occasionSpendTotals(members: RecordListItem[]): {
  expense: number;
  income: number;
} {
  let expense = 0;
  let income = 0;
  for (const item of members) {
    if (item.type === "transfer" || isAdjustmentFlag(item.is_adjustment)) continue;
    if (!isLifestyleRole(item.person_role)) continue;
    if (item.type === "expense") expense += item.amount;
    else income += item.amount;
  }
  return { expense, income };
}

export function groupEventListRows(
  records: RecordListItem[],
  occasions: Occasion[],
): { title: string; key: string; data: EventListRow[] }[] {
  const byId = new Map(occasions.map((o) => [o.id, o]));
  const membersByOcc = new Map<string, RecordListItem[]>();
  const loose: RecordListItem[] = [];

  for (const rec of records) {
    if (rec.occasion_id && byId.has(rec.occasion_id)) {
      const list = membersByOcc.get(rec.occasion_id) ?? [];
      list.push(rec);
      membersByOcc.set(rec.occasion_id, list);
    } else {
      loose.push(rec);
    }
  }

  const rowsByDay = new Map<string, EventListRow[]>();

  function push(day: string, row: EventListRow) {
    const list = rowsByDay.get(day) ?? [];
    list.push(row);
    rowsByDay.set(day, list);
  }

  const seenOcc = new Set<string>();
  for (const occ of occasions) {
    const members = membersByOcc.get(occ.id) ?? [];
    const totals = occasionSpendTotals(members);
    const day = dateKey(occ.occurred_at);
    push(day, {
      kind: "occasion",
      occasion: occ,
      members,
      expense: totals.expense,
      income: totals.income,
    });
    seenOcc.add(occ.id);
  }

  for (const [occId, members] of membersByOcc) {
    if (seenOcc.has(occId)) continue;
    const first = members[0];
    const totals = occasionSpendTotals(members);
    push(dateKey(first.occurred_at), {
      kind: "occasion",
      occasion: {
        id: occId,
        title: first.occasion_title ?? "Occasion",
        occurred_at: first.occurred_at,
        note: "",
      },
      members,
      expense: totals.expense,
      income: totals.income,
    });
  }

  for (const rec of loose) {
    push(dateKey(rec.occurred_at), { kind: "record", item: rec });
  }

  const keys = [...rowsByDay.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return keys.map((key) => {
    const data = rowsByDay.get(key) ?? [];
    data.sort((a, b) => {
      const ta = a.kind === "record" ? a.item.occurred_at : a.occasion.occurred_at;
      const tb = b.kind === "record" ? b.item.occurred_at : b.occasion.occurred_at;
      if (ta === tb) return 0;
      return ta < tb ? 1 : -1;
    });
    const sample =
      data[0]?.kind === "record" ? data[0].item.occurred_at : data[0].occasion.occurred_at;
    return {
      key,
      title: formatDateSectionHeader(sample),
      data,
    };
  });
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function parseOccasionDay(iso: string): Date {
  return parseOccurredAt(iso);
}
