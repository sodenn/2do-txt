import { create } from "zustand";

interface FileManagementDialogState {
  open: boolean;
  openFileManagementDialog: () => void;
  closeFileManagementDialog: () => void;
}

export const useFileManagementDialogStore = create<FileManagementDialogState>(
  (set) => ({
    open: false,
    openFileManagementDialog: () => set({ open: true }),
    closeFileManagementDialog: () => set({ open: false }),
  }),
);
