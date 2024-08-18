import { create } from "zustand";

interface ShortcutsDialogState {
  open: boolean;
  openShortcutsDialog: () => void;
  closeShortcutsDialog: () => void;
}

export const useShortcutsDialogStore = create<ShortcutsDialogState>((set) => ({
  open: false,
  openShortcutsDialog: () => set({ open: true }),
  closeShortcutsDialog: () => set({ open: false }),
}));
