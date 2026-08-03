import { create } from "zustand";

type MorePaneState = {
  open: boolean;
  openMore: () => void;
  closeMore: () => void;
};

/** Native More edge drawer visibility. Web uses the `/more` route instead. */
export const useMorePaneStore = create<MorePaneState>((set) => ({
  open: false,
  openMore: () => set({ open: true }),
  closeMore: () => set({ open: false }),
}));
