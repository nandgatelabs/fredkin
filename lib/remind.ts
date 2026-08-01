import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { log } from "@/lib/logger";

const STORAGE_KEY = "money-money.lastRemindDate";
const NATIVE_REMIND_ID = "money-money-daily-remind";
/** Gentle evening nudge — local device time. */
const REMIND_HOUR = 19;
const REMIND_MINUTE = 0;

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

/** Schedule or cancel the native daily local notification. */
export async function syncNativeDailyRemind(enabled: boolean): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(NATIVE_REMIND_ID).catch(
      () => undefined,
    );
    // Also clear any legacy schedules without a fixed id
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of pending) {
      if (n.identifier === NATIVE_REMIND_ID || n.content?.data?.kind === "daily-remind") {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    if (!enabled) {
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
        title: "money-money",
        body: "Quick check-in — add today’s expenses when you have a moment.",
        data: { kind: "daily-remind" },
        ...(Platform.OS === "android" ? { channelId: "daily-remind" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMIND_HOUR,
        minute: REMIND_MINUTE,
        ...(Platform.OS === "android" ? { channelId: "daily-remind" } : {}),
      },
    });
    log.info("Native daily remind scheduled", { hour: REMIND_HOUR, minute: REMIND_MINUTE });
  } catch (e) {
    log.warn("syncNativeDailyRemind failed", e);
  }
}

/**
 * Web: fire at most one local reminder per calendar day while the app is open.
 * Native: keep the OS schedule in sync (scheduled notification, not in-app poll).
 */
export function maybeFireDailyRemind(enabled: boolean) {
  if (Platform.OS !== "web") {
    void syncNativeDailyRemind(enabled);
    return;
  }
  if (!enabled) return;
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
