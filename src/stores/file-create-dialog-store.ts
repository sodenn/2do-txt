import { create } from "zustand";

interface FileCreateDialogStoreData {
  open: boolean;
}

interface FileCreateDialogStoreInterface extends FileCreateDialogStoreData {
  open: boolean;
  openFileCreateDialog: () => void;
  closeFileCreateDialog: () => void;
}

export const useFileCreateDialogStore = create<FileCreateDialogStoreInterface>(
  (set) => ({
    open: false,
    openFileCreateDialog: () => set({ open: true }),
    closeFileCreateDialog: () =>
      set({
        open: false,
      }),
  }),
);
