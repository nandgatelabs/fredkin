import { create } from "zustand";

import { log } from "@/lib/logger";

type MorePaneState = {
  open: boolean;
  openMore: () => void;
  closeMore: () => void;
};

/** Native More edge drawer visibility. Web uses the `/more` route instead. */
export const useMorePaneStore = create<MorePaneState>((set) => ({
  open: false,
  openMore: () => {
    log.debug("ui more open");
    set({ open: true });
  },
  closeMore: () => {
    log.debug("ui more close");
    set({ open: false });
  },
}));
