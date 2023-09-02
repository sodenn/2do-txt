import { create } from "zustand";

interface FileManagementDialogStoreInterface {
  open: boolean;
  openFileManagementDialog: () => void;
  closeFileManagementDialog: () => void;
}

export const useFileManagementDialogStore =
  create<FileManagementDialogStoreInterface>((set) => ({
    open: false,
    openFileManagementDialog: () => set({ open: true }),
    closeFileManagementDialog: () => set({ open: false }),
  }));
