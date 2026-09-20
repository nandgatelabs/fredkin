import { getSetting, setSetting } from "@/db/client";
import { parseLocalIso, toIsoLocal } from "@/lib/datetime";

export const STICKY_NEW_EVENT_SETTING_KEY = "lastNewEventOccurredAt";

export function calendarDateKey(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return calendarDateKey(a) === calendarDateKey(b);
}

export function isSameDateAndMinute(a: Date, b: Date): boolean {
  return (
    isSameCalendarDay(a, b) &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

/** Last saved new-event stamp, or now if nothing stored. */
export function resolveNewEventOccurredAt(
  storedIso: string | null | undefined,
  now: Date = new Date(),
): Date {
  if (!storedIso) return now;
  const stored = parseLocalIso(storedIso);
  if (Number.isNaN(stored.getTime())) return now;
  return stored;
}

export async function readStickyNewEventOccurredAt(): Promise<string | null> {
  const raw = await getSetting(STICKY_NEW_EVENT_SETTING_KEY);
  if (raw == null || raw === "") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return raw;
  }
}

export async function writeStickyNewEventOccurredAt(d: Date): Promise<void> {
  await setSetting(STICKY_NEW_EVENT_SETTING_KEY, JSON.stringify(toIsoLocal(d)));
}
