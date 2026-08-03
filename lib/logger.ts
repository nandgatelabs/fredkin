/**
 * In-app ring buffer + console logging.
 *
 * Levels:
 * - debug — verbose trail (dev by default): taps, nav, schedule sync, internals
 * - info  — product milestones: boot, save, import/export done
 * - warn / error — always kept
 *
 * Modes:
 * - verbose: on in __DEV__; off in production unless forced
 * - recording: Preferences → Record logs (buffer for export); errors always kept
 */
import { Platform } from "react-native";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  t: string;
  level: LogLevel;
  msg: string;
  data?: string;
};

const MAX_PROD = 800;
const MAX_VERBOSE = 5000;
const entries: LogEntry[] = [];

/** Persist milestones to the exportable buffer (Preferences → Record logs). */
let recording = true;
/** Emit debug + print info/debug to the console (default: __DEV__). */
let verbose = typeof __DEV__ !== "undefined" && __DEV__;

export function setLogRecording(enabled: boolean) {
  recording = enabled;
  push("info", enabled ? "Log recording enabled" : "Log recording disabled");
}

export function isLogRecording(): boolean {
  return recording;
}

export function setLogVerbose(enabled: boolean) {
  verbose = enabled;
  push("info", enabled ? "Verbose logging on" : "Verbose logging off");
}

export function isLogVerbose(): boolean {
  return verbose;
}

function maxEntries() {
  return verbose ? MAX_VERBOSE : MAX_PROD;
}

/** Persist into the exportable ring buffer. */
function shouldKeep(level: LogLevel): boolean {
  if (level === "error" || level === "warn") return true;
  if (!recording) return false;
  if (level === "debug") return verbose;
  return true;
}

/** Print to Metro / device console. */
function shouldPrint(level: LogLevel): boolean {
  if (level === "error" || level === "warn") return true;
  // info + debug → console when verbose (dev builds)
  return verbose;
}

function push(level: LogLevel, msg: string, data?: unknown) {
  const keep = shouldKeep(level);
  const print = shouldPrint(level);
  if (!keep && !print) return;

  const dataStr =
    data === undefined
      ? undefined
      : typeof data === "string"
        ? data
        : safeJson(data);

  if (keep) {
    entries.push({
      t: new Date().toISOString(),
      level,
      msg,
      data: dataStr,
    });
    const max = maxEntries();
    if (entries.length > max) entries.splice(0, entries.length - max);
  }

  if (!print) return;

  const line = `[Fredkin] ${level.toUpperCase()} ${msg}${
    dataStr ? ` ${dataStr}` : ""
  }`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const log = {
  /** Verbose trail — navigation, taps, internals (dev / verbose only). */
  debug: (msg: string, data?: unknown) => push("debug", msg, data),
  /** Milestone — boot, save, import/export complete (prod buffer). */
  info: (msg: string, data?: unknown) => push("info", msg, data),
  warn: (msg: string, data?: unknown) => push("warn", msg, data),
  error: (msg: string, data?: unknown) => push("error", msg, data),
};

export function getLogText(): string {
  const header = [
    `Fredkin logs`,
    `platform=${Platform.OS}`,
    `verbose=${verbose}`,
    `recording=${recording}`,
    `dev=${typeof __DEV__ !== "undefined" && __DEV__}`,
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
