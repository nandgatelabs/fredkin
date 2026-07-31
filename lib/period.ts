import type { ViewMode } from "@/store/settings";

export type DateRange = { start: Date; end: Date };

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function rangeForViewMode(anchorIso: string, viewMode: ViewMode): DateRange {
  const anchor = parseIsoDate(anchorIso);

  switch (viewMode) {
    case "daily":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "weekly": {
      const day = anchor.getDay(); // 0 Sun
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "monthly":
      return {
        start: startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1)),
        end: endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
      };
    case "months3": {
      const start = new Date(anchor.getFullYear(), anchor.getMonth() - 2, 1);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "months6": {
      const start = new Date(anchor.getFullYear(), anchor.getMonth() - 5, 1);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "yearly":
      return {
        start: startOfDay(new Date(anchor.getFullYear(), 0, 1)),
        end: endOfDay(new Date(anchor.getFullYear(), 11, 31)),
      };
  }
}

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

export function formatPeriodLabel(anchorIso: string, viewMode: ViewMode): string {
  const { start, end } = rangeForViewMode(anchorIso, viewMode);
  const a = parseIsoDate(anchorIso);

  switch (viewMode) {
    case "daily":
      return `${MONTHS[a.getMonth()]} ${String(a.getDate()).padStart(2, "0")}, ${a.getFullYear()}`;
    case "weekly": {
      const s = `${MONTHS[start.getMonth()]} ${String(start.getDate()).padStart(2, "0")}`;
      const e = `${MONTHS[end.getMonth()]} ${String(end.getDate()).padStart(2, "0")}`;
      return `${s} - ${e}`;
    }
    case "monthly":
      return `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    case "months3":
    case "months6": {
      const s = `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      const e = `${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
      return `${s} – ${e}`;
    }
    case "yearly":
      return String(a.getFullYear());
  }
}
