import { create } from "zustand";

export type PeriodState = {
  /** Anchor date for the selected period (ISO date YYYY-MM-DD). */
  anchorDate: string;
  setAnchorDate: (isoDate: string) => void;
  shiftMonths: (delta: number) => void;
};

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftMonth(isoDate: string, delta: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const next = new Date(y, m - 1 + delta, Math.min(d, 28));
  // Clamp to last day of target month
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  const day = Math.min(d, last);
  const yy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  anchorDate: todayIsoDate(),
  setAnchorDate: (anchorDate) => set({ anchorDate }),
  shiftMonths: (delta) => set({ anchorDate: shiftMonth(get().anchorDate, delta) }),
}));
