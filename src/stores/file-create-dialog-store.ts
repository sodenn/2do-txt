import { create } from "zustand";

interface FileCreateDialogState {
  open: boolean;
  openFileCreateDialog: () => void;
  closeFileCreateDialog: () => void;
}

export const useFileCreateDialogStore = create<FileCreateDialogState>(
  (set) => ({
    open: false,
    openFileCreateDialog: () => set({ open: true }),
    closeFileCreateDialog: () =>
      set({
        open: false,
      }),
  }),
);
