import { create } from "zustand";

import type { ViewMode } from "@/store/settings";
import { useSettingsStore } from "@/store/settings";

export type PeriodState = {
  /** Anchor date for the selected period (ISO date YYYY-MM-DD). */
  anchorDate: string;
  setAnchorDate: (isoDate: string) => void;
  /** Shift the period by ±1 unit for the current view mode. */
  shiftPeriod: (delta: number) => void;
  /** @deprecated use shiftPeriod */
  shiftMonths: (delta: number) => void;
};

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftAnchor(isoDate: string, delta: number, viewMode: ViewMode) {
  const d = parseIso(isoDate);
  switch (viewMode) {
    case "daily":
      d.setDate(d.getDate() + delta);
      break;
    case "weekly":
      d.setDate(d.getDate() + delta * 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + delta);
      break;
    case "months3":
      d.setMonth(d.getMonth() + delta * 3);
      break;
    case "months6":
      d.setMonth(d.getMonth() + delta * 6);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + delta);
      break;
  }
  return toIso(d);
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  anchorDate: todayIsoDate(),
  setAnchorDate: (anchorDate) => set({ anchorDate }),
  shiftPeriod: (delta) => {
    const viewMode = useSettingsStore.getState().viewMode;
    set({ anchorDate: shiftAnchor(get().anchorDate, delta, viewMode) });
  },
  shiftMonths: (delta) => {
    const viewMode = useSettingsStore.getState().viewMode;
    set({ anchorDate: shiftAnchor(get().anchorDate, delta, viewMode) });
  },
}));
