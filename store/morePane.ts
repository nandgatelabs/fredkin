import { create } from "zustand";

import { log } from "@/lib/logger";

type MorePaneState = {
  open: boolean;
  /** After leaving a More stack screen (Settings/Data/…), reopen the drawer. */
  returnToMore: boolean;
  openMore: () => void;
  closeMore: () => void;
  /** Close drawer but remember to reopen when the user backs out of a stack screen. */
  leaveForStack: () => void;
  clearReturnToMore: () => void;
};

/** Native More edge drawer visibility. Web uses the `/more` route instead. */
export const useMorePaneStore = create<MorePaneState>((set) => ({
  open: false,
  returnToMore: false,
  openMore: () => {
    log.debug("ui more open");
    set({ open: true });
  },
  closeMore: () => {
    log.debug("ui more close");
    set({ open: false, returnToMore: false });
  },
  leaveForStack: () => {
    log.debug("ui more leave for stack");
    set({ open: false, returnToMore: true });
  },
  clearReturnToMore: () => {
    set({ returnToMore: false });
  },
}));
