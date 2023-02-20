import { create } from "zustand";

interface ShortcutsDialogState {
  open: boolean;
  openShortcutsDialog: () => void;
  closeShortcutsDialog: () => void;
}

const useShortcutsDialogStore = create<ShortcutsDialogState>((set) => ({
  open: false,
  openShortcutsDialog: () => set({ open: true }),
  closeShortcutsDialog: () => set({ open: false }),
}));

export default useShortcutsDialogStore;
