import { Platform } from "react-native";

const STORAGE_KEY = "money-money.lastRemindDate";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readLast(): string | null {
  if (Platform.OS !== "web") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLast(value: string) {
  if (Platform.OS !== "web") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

/** Ask for notification permission (web). Returns whether permission is granted. */
export async function ensureRemindPermission(): Promise<boolean> {
  if (Platform.OS !== "web") return false;
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Fire at most one local reminder per calendar day while the app is open. */
export function maybeFireDailyRemind(enabled: boolean) {
  if (!enabled || Platform.OS !== "web") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const today = todayKey();
  if (readLast() === today) return;
  try {
    new Notification("money-money", {
      body: "Quick check-in — add today’s expenses when you have a moment.",
      tag: "money-money-daily-remind",
    });
    writeLast(today);
  } catch {
    /* ignore blocked notifications */
  }
}

export function openSystemNotificationSettings() {
  if (Platform.OS === "web") {
    window.alert(
      "Use your browser’s site settings to manage notification permission for this app.",
    );
  }
}
