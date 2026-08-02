import { create } from "zustand";

type SearchModalState = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

/** Web-centered search dialog visibility. */
export const useSearchModalStore = create<SearchModalState>((set) => ({
  open: false,
  openSearch: () => set({ open: true }),
  closeSearch: () => set({ open: false }),
}));
