import { create } from "zustand";

import { getSetting, setSetting } from "@/db/client";
import { applyPalette, type ThemeId, type UiMode } from "@/theme/colors";

export type ViewMode =
  | "daily"
  | "weekly"
  | "monthly"
  | "months3"
  | "months6"
  | "yearly";

export type SettingsState = {
  hydrated: boolean;
  viewMode: ViewMode;
  showTotal: boolean;
  carryOver: boolean;
  currencySign: string;
  currencyPosition: "start" | "end";
  decimalPlaces: number;
  notesInList: boolean;
  themeId: ThemeId;
  uiMode: UiMode;
  passcodeEnabled: boolean;
  passcodeSalt: string;
  passcodeHash: string;
  remindEveryday: boolean;
  crashStats: boolean;
  /** Session-only: cleared on refresh. */
  sessionUnlocked: boolean;
  hydrate: () => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;
  setShowTotal: (value: boolean) => Promise<void>;
  setCarryOver: (value: boolean) => Promise<void>;
  setSessionUnlocked: (value: boolean) => void;
  persistAppearance: (next: {
    currencySign: string;
    currencyPosition: "start" | "end";
    decimalPlaces: number;
    notesInList: boolean;
    themeId: ThemeId;
    uiMode: UiMode;
  }) => Promise<{ themeChanged: boolean }>;
  persistPasscode: (next: {
    enabled: boolean;
    salt: string;
    hash: string;
  }) => Promise<void>;
  persistRemind: (enabled: boolean) => Promise<void>;
  persistCrashStats: (enabled: boolean) => Promise<void>;
};

const DEFAULTS = {
  viewMode: "monthly" as ViewMode,
  showTotal: true,
  carryOver: false,
  currencySign: "₹",
  currencyPosition: "start" as const,
  decimalPlaces: 2,
  notesInList: true,
  themeId: "original" as ThemeId,
  uiMode: "dark" as UiMode,
  passcodeEnabled: false,
  passcodeSalt: "",
  passcodeHash: "",
  remindEveryday: false,
  crashStats: false,
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getSetting(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  await setSetting(key, JSON.stringify(value));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  sessionUnlocked: false,
  ...DEFAULTS,

  hydrate: async () => {
    const [
      viewMode,
      showTotal,
      carryOver,
      currencySign,
      currencyPosition,
      decimalPlaces,
      notesInList,
      themeId,
      uiMode,
      passcodeEnabled,
      passcodeSalt,
      passcodeHash,
      remindEveryday,
      crashStats,
    ] = await Promise.all([
      readJson<ViewMode>("viewMode", DEFAULTS.viewMode),
      readJson<boolean>("showTotal", DEFAULTS.showTotal),
      readJson<boolean>("carryOver", DEFAULTS.carryOver),
      readJson<string>("currencySign", DEFAULTS.currencySign),
      readJson<"start" | "end">("currencyPosition", DEFAULTS.currencyPosition),
      readJson<number>("decimalPlaces", DEFAULTS.decimalPlaces),
      readJson<boolean>("notesInList", DEFAULTS.notesInList),
      readJson<ThemeId>("themeId", DEFAULTS.themeId),
      readJson<UiMode>("uiMode", DEFAULTS.uiMode),
      readJson<boolean>("passcodeEnabled", DEFAULTS.passcodeEnabled),
      readJson<string>("passcodeSalt", DEFAULTS.passcodeSalt),
      readJson<string>("passcodeHash", DEFAULTS.passcodeHash),
      readJson<boolean>("remindEveryday", DEFAULTS.remindEveryday),
      readJson<boolean>("crashStats", DEFAULTS.crashStats),
    ]);

    applyPalette(themeId, uiMode);

    set({
      hydrated: true,
      viewMode,
      showTotal,
      carryOver,
      currencySign,
      currencyPosition,
      decimalPlaces,
      notesInList,
      themeId,
      uiMode,
      passcodeEnabled,
      passcodeSalt,
      passcodeHash,
      remindEveryday,
      crashStats,
      // Unlocked when passcode is off; otherwise wait for PIN.
      sessionUnlocked: !passcodeEnabled,
    });
  },

  setViewMode: async (viewMode) => {
    set({ viewMode });
    await writeJson("viewMode", viewMode);
  },

  setShowTotal: async (showTotal) => {
    set({ showTotal });
    await writeJson("showTotal", showTotal);
  },

  setCarryOver: async (carryOver) => {
    set({ carryOver });
    await writeJson("carryOver", carryOver);
  },

  setSessionUnlocked: (sessionUnlocked) => set({ sessionUnlocked }),

  persistAppearance: async (next) => {
    const prev = get();
    const themeChanged =
      prev.themeId !== next.themeId || prev.uiMode !== next.uiMode;

    await Promise.all([
      writeJson("currencySign", next.currencySign),
      writeJson("currencyPosition", next.currencyPosition),
      writeJson("decimalPlaces", next.decimalPlaces),
      writeJson("notesInList", next.notesInList),
      writeJson("themeId", next.themeId),
      writeJson("uiMode", next.uiMode),
    ]);

    applyPalette(next.themeId, next.uiMode);
    set({ ...next });
    return { themeChanged };
  },

  persistPasscode: async ({ enabled, salt, hash }) => {
    await Promise.all([
      writeJson("passcodeEnabled", enabled),
      writeJson("passcodeSalt", salt),
      writeJson("passcodeHash", hash),
    ]);
    set({
      passcodeEnabled: enabled,
      passcodeSalt: salt,
      passcodeHash: hash,
      sessionUnlocked: enabled ? true : true,
    });
  },

  persistRemind: async (remindEveryday) => {
    await writeJson("remindEveryday", remindEveryday);
    set({ remindEveryday });
  },

  persistCrashStats: async (crashStats) => {
    await writeJson("crashStats", crashStats);
    set({ crashStats });
  },
}));
