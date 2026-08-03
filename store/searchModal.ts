import { create } from "zustand";

import { log } from "@/lib/logger";

type SearchModalState = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

/** Web-centered search dialog visibility. */
export const useSearchModalStore = create<SearchModalState>((set) => ({
  open: false,
  openSearch: () => {
    log.debug("ui search open");
    set({ open: true });
  },
  closeSearch: () => {
    log.debug("ui search close");
    set({ open: false });
  },
}));
