import { Linking, Platform } from "react-native";

import { log } from "@/lib/logger";

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

/** Ask for notification permission. Native daily remind is tracked separately (#23). */
export async function ensureRemindPermission(): Promise<boolean> {
  if (Platform.OS !== "web") {
    // Preference can still be stored; native notifications land with #23.
    log.info("Remind permission: native deferred to system notifications work");
    return true;
  }
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Fire at most one local reminder per calendar day while the app is open (web). */
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
    log.info("Daily remind notification fired");
  } catch (e) {
    log.warn("Daily remind failed", e);
  }
}

export function openSystemNotificationSettings() {
  if (Platform.OS === "web") {
    log.info("Opened web notification settings hint");
    console.info(
      "[money-money] Manage notification permission in the browser’s site settings for this origin.",
    );
    return;
  }
  void Linking.openSettings().catch((e) => {
    log.warn("openSettings failed", e);
  });
}
