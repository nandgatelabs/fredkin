import { Platform } from "react-native";

import {
  resolvePalette,
  type ColorTokens,
  type ThemeId,
  type UiMode,
} from "./palettes";

const MIRROR_KEY = "money-money.themeMirror";

type Mirror = { themeId: ThemeId; uiMode: UiMode };

function readMirror(): Mirror {
  if (Platform.OS === "web") {
    try {
      const raw = window.localStorage.getItem(MIRROR_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Mirror;
        if (parsed?.themeId && parsed?.uiMode) return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return { themeId: "original", uiMode: "dark" };
}

function writeMirror(themeId: ThemeId, uiMode: UiMode) {
  if (Platform.OS !== "web") return;
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify({ themeId, uiMode }));
  } catch {
    /* ignore */
  }
}

const boot = readMirror();

/** Active palette. Seeded sync from localStorage on web so StyleSheet.create sees the right tokens after reload. */
export const colors: ColorTokens = { ...resolvePalette(boot.themeId, boot.uiMode) };

export function applyPalette(themeId: ThemeId, uiMode: UiMode) {
  const next = resolvePalette(themeId, uiMode);
  (Object.keys(next) as (keyof ColorTokens)[]).forEach((key) => {
    colors[key] = next[key];
  });
  writeMirror(themeId, uiMode);
}

export type { ColorTokens, ThemeId, UiMode };
