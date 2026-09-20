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
] as const;

export function formatComposerDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatComposerTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function toIsoLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Parse `YYYY-MM-DDTHH:mm:ss` as local wall time (no UTC shift). */
export function parseLocalIso(iso: string): Date {
  const trimmed = iso.trim().replace(/Z$/i, "");
  const [datePart, rest = "00:00:00"] = trimmed.split("T");
  const [y, month, day] = datePart.split("-").map(Number);
  const timePart = rest.split(/[+-]/)[0] ?? "00:00:00";
  const [hh, mm, ss] = timePart.split(":").map(Number);
  return new Date(y, (month ?? 1) - 1, day ?? 1, hh || 0, mm || 0, ss || 0);
}

export function setDatePart(base: Date, year: number, monthIndex: number, day: number): Date {
  const next = new Date(base);
  next.setFullYear(year, monthIndex, day);
  return next;
}

export function setTimePart(base: Date, hours24: number, minutes: number): Date {
  const next = new Date(base);
  next.setHours(hours24, minutes, 0, 0);
  return next;
}
