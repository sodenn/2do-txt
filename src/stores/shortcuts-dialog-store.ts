import { create } from "zustand";

interface ShortcutsDialogStoreInterface {
  open: boolean;
  openShortcutsDialog: () => void;
  closeShortcutsDialog: () => void;
}

export const useShortcutsDialogStore = create<ShortcutsDialogStoreInterface>(
  (set) => ({
    open: false,
    openShortcutsDialog: () => set({ open: true }),
    closeShortcutsDialog: () => set({ open: false }),
  }),
);
