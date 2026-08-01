import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { log } from "@/lib/logger";

const STORAGE_KEY = "money-money.lastRemindDate";
const NATIVE_REMIND_ID = "money-money-daily-remind";

export const DEFAULT_REMIND_HOUR = 19;
export const DEFAULT_REMIND_MINUTE = 0;

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

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

export function formatRemindTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("daily-remind", {
    name: "Daily remind",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
  });
}

/** Ask for notification permission (web Notification API or expo-notifications). */
export async function ensureRemindPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    log.info("Native remind permission", asked.status);
    return asked.granted;
  } catch (e) {
    log.warn("Remind permission failed", e);
    return false;
  }
}

export type RemindSchedule = {
  enabled: boolean;
  hour?: number;
  minute?: number;
};

/** Schedule or cancel the native daily local notification at the chosen local time. */
export async function syncNativeDailyRemind(schedule: RemindSchedule): Promise<void> {
  if (Platform.OS === "web") return;
  const hour = schedule.hour ?? DEFAULT_REMIND_HOUR;
  const minute = schedule.minute ?? DEFAULT_REMIND_MINUTE;
  try {
    await Notifications.cancelScheduledNotificationAsync(NATIVE_REMIND_ID).catch(
      () => undefined,
    );
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of pending) {
      if (n.identifier === NATIVE_REMIND_ID || n.content?.data?.kind === "daily-remind") {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    if (!schedule.enabled) {
      log.info("Native daily remind cancelled");
      return;
    }

    const ok = await ensureRemindPermission();
    if (!ok) {
      log.warn("Native daily remind skipped — permission not granted");
      return;
    }

    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: NATIVE_REMIND_ID,
      content: {
        title: "Fredkin",
        body: "Quick check-in — add today’s spend when you have a moment.",
        data: { kind: "daily-remind" },
        ...(Platform.OS === "android" ? { channelId: "daily-remind" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === "android" ? { channelId: "daily-remind" } : {}),
      },
    });
    log.info("Native daily remind scheduled", { hour, minute });
  } catch (e) {
    log.warn("syncNativeDailyRemind failed", e);
  }
}

/**
 * Web: fire at most once per day after the chosen local time while the app is open.
 * Native: keep the OS schedule in sync.
 */
export function maybeFireDailyRemind(
  enabled: boolean,
  hour = DEFAULT_REMIND_HOUR,
  minute = DEFAULT_REMIND_MINUTE,
) {
  if (Platform.OS !== "web") {
    void syncNativeDailyRemind({ enabled, hour, minute });
    return;
  }
  if (!enabled) return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < hour * 60 + minute) return;
  const today = todayKey();
  if (readLast() === today) return;
  try {
    new Notification("Fredkin", {
      body: "Quick check-in — add today’s spend when you have a moment.",
      tag: "money-money-daily-remind",
    });
    writeLast(today);
    log.info("Daily remind notification fired", { hour, minute });
  } catch (e) {
    log.warn("Daily remind failed", e);
  }
}

export function openSystemNotificationSettings() {
  if (Platform.OS === "web") {
    log.info("Opened web notification settings hint");
    console.info(
      "[Fredkin] Manage notification permission in the browser’s site settings for this origin.",
    );
    return;
  }
  void Linking.openSettings().catch((e) => {
    log.warn("openSettings failed", e);
  });
}
