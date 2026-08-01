/**
 * In-app ring buffer for debugging. Controlled by Preferences → Record logs
 * (default on). Export from the drawer as a text file.
 */
import { Platform } from "react-native";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  t: string;
  level: LogLevel;
  msg: string;
  data?: string;
};

const MAX = 2500;
const entries: LogEntry[] = [];
let recording = true;

export function setLogRecording(enabled: boolean) {
  recording = enabled;
  if (enabled) {
    push("info", "Log recording enabled");
  }
}

export function isLogRecording(): boolean {
  return recording;
}

function push(level: LogLevel, msg: string, data?: unknown) {
  if (!recording && level !== "error") return;
  const entry: LogEntry = {
    t: new Date().toISOString(),
    level,
    msg,
    data:
      data === undefined
        ? undefined
        : typeof data === "string"
          ? data
          : safeJson(data),
  };
  entries.push(entry);
  if (entries.length > MAX) entries.splice(0, entries.length - MAX);

  const line = `[money-money] ${entry.level.toUpperCase()} ${entry.msg}${
    entry.data ? ` ${entry.data}` : ""
  }`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (__DEV__) console.log(line);
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const log = {
  debug: (msg: string, data?: unknown) => push("debug", msg, data),
  info: (msg: string, data?: unknown) => push("info", msg, data),
  warn: (msg: string, data?: unknown) => push("warn", msg, data),
  error: (msg: string, data?: unknown) => push("error", msg, data),
};

export function getLogText(): string {
  const header = [
    `Fredkin logs`,
    `platform=${Platform.OS}`,
    `recording=${recording}`,
    `entries=${entries.length}`,
    `exportedAt=${new Date().toISOString()}`,
    "",
  ].join("\n");
  const body = entries
    .map((e) => {
      const extra = e.data ? ` | ${e.data}` : "";
      return `${e.t} [${e.level}] ${e.msg}${extra}`;
    })
    .join("\n");
  return `${header}${body}\n`;
}

export function clearLogs() {
  entries.length = 0;
  push("info", "Logs cleared");
}
