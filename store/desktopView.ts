import { create } from "zustand";

/** Web desktop layout: side-by-side (default) or a single full pane. */
export type DesktopView = "split" | "events" | "insights";

type DesktopViewState = {
  view: DesktopView;
  setView: (view: DesktopView) => void;
};

export const useDesktopViewStore = create<DesktopViewState>((set) => ({
  view: "split",
  setView: (view) => set({ view }),
}));
