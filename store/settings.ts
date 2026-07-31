import { create } from "zustand";

import { getSetting, setSetting } from "@/db/client";

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
  hydrate: () => Promise<void>;
  setViewMode: (mode: ViewMode) => Promise<void>;
  setShowTotal: (value: boolean) => Promise<void>;
  setCarryOver: (value: boolean) => Promise<void>;
};

const DEFAULTS = {
  viewMode: "monthly" as ViewMode,
  showTotal: true,
  carryOver: false,
  currencySign: "₹",
  currencyPosition: "start" as const,
  decimalPlaces: 2,
  notesInList: true,
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

export const useSettingsStore = create<SettingsState>((set) => ({
  hydrated: false,
  ...DEFAULTS,

  hydrate: async () => {
    const [viewMode, showTotal, carryOver, currencySign, currencyPosition, decimalPlaces, notesInList] =
      await Promise.all([
        readJson<ViewMode>("viewMode", DEFAULTS.viewMode),
        readJson<boolean>("showTotal", DEFAULTS.showTotal),
        readJson<boolean>("carryOver", DEFAULTS.carryOver),
        readJson<string>("currencySign", DEFAULTS.currencySign),
        readJson<"start" | "end">("currencyPosition", DEFAULTS.currencyPosition),
        readJson<number>("decimalPlaces", DEFAULTS.decimalPlaces),
        readJson<boolean>("notesInList", DEFAULTS.notesInList),
      ]);

    set({
      hydrated: true,
      viewMode,
      showTotal,
      carryOver,
      currencySign,
      currencyPosition,
      decimalPlaces,
      notesInList,
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
}));
