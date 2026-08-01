import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

import {
  normalizeThemeId,
  resolvePalette,
  type ColorTokens,
  type ThemeId,
  type UiMode,
} from "./palettes";

const MIRROR_KEY = "money-money.themeMirror";

type Mirror = { themeId: ThemeId; uiMode: UiMode };

const UI_MODES = new Set(["dark", "light"]);

function parseUiMode(raw: unknown): UiMode | null {
  return typeof raw === "string" && UI_MODES.has(raw) ? (raw as UiMode) : null;
}

function readMirrorWeb(): Mirror | null {
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { themeId?: unknown; uiMode?: unknown };
    const themeId = normalizeThemeId(parsed?.themeId);
    const uiMode = parseUiMode(parsed?.uiMode);
    if (uiMode) return { themeId, uiMode };
  } catch {
    /* ignore */
  }
  return null;
}

/** Sync read from SQLite so StyleSheet.create sees the right palette after reload. */
function readMirrorNative(): Mirror | null {
  try {
    const db = SQLite.openDatabaseSync("money-money.db");
    const themeRow = db.getFirstSync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      "themeId",
    );
    const uiRow = db.getFirstSync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      "uiMode",
    );
    const themeId = themeRow?.value
      ? normalizeThemeId(JSON.parse(themeRow.value))
      : null;
    const uiMode = uiRow?.value ? parseUiMode(JSON.parse(uiRow.value)) : null;
    if (themeId && uiMode) return { themeId, uiMode };
  } catch {
    /* DB may not exist on first launch */
  }
  return null;
}

function readMirror(): Mirror {
  if (Platform.OS === "web") {
    return readMirrorWeb() ?? { themeId: "glassMist", uiMode: "dark" };
  }
  return readMirrorNative() ?? { themeId: "glassMist", uiMode: "dark" };
}

function writeMirror(themeId: ThemeId, uiMode: UiMode) {
  if (Platform.OS === "web") {
    try {
      window.localStorage.setItem(
        MIRROR_KEY,
        JSON.stringify({ themeId: normalizeThemeId(themeId), uiMode }),
      );
    } catch {
      /* ignore */
    }
  }
}

const boot = readMirror();

/** Active palette. Seeded sync so StyleSheet.create sees the right tokens after reload. */
export const colors: ColorTokens = { ...resolvePalette(boot.themeId, boot.uiMode) };

export function applyPalette(themeId: ThemeId, uiMode: UiMode) {
  const next = resolvePalette(normalizeThemeId(themeId), uiMode);
  (Object.keys(next) as (keyof ColorTokens)[]).forEach((key) => {
    colors[key] = next[key];
  });
  writeMirror(themeId, uiMode);
}

export type { ColorTokens, ThemeId, UiMode };
export { normalizeThemeId } from "./palettes";
