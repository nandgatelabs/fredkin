import { create } from "zustand";

type MorePaneState = {
  open: boolean;
  openMore: () => void;
  closeMore: () => void;
};

/** Shared More drawer visibility — edge tab (native) or header control (web). */
export const useMorePaneStore = create<MorePaneState>((set) => ({
  open: false,
  openMore: () => set({ open: true }),
  closeMore: () => set({ open: false }),
}));
