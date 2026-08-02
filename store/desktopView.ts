import { create } from "zustand";

/** Web desktop layout: side-by-side (default) or a single full pane. */
export type DesktopView = "split" | "events" | "insights";

const STORAGE_KEY = "fredkin.desktopView";

function readStoredView(): DesktopView {
  if (typeof window === "undefined") return "split";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "split" || raw === "events" || raw === "insights") return raw;
  } catch {
    /* ignore */
  }
  return "split";
}

function persistView(view: DesktopView) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}

type DesktopViewState = {
  view: DesktopView;
  setView: (view: DesktopView) => void;
};

export const useDesktopViewStore = create<DesktopViewState>((set) => ({
  view: readStoredView(),
  setView: (view) => {
    persistView(view);
    set({ view });
  },
}));
