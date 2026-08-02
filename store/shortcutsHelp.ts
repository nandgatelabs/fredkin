import { create } from "zustand";

type State = {
  open: boolean;
  openHelp: () => void;
  closeHelp: () => void;
};

export const useShortcutsHelpStore = create<State>((set) => ({
  open: false,
  openHelp: () => set({ open: true }),
  closeHelp: () => set({ open: false }),
}));
