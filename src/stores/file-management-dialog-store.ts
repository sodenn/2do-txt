import { create } from "zustand";

interface FileManagementDialogStoreInterface {
  open: boolean;
  openFileManagementDialog: () => void;
  closeFileManagementDialog: () => void;
}

const useFileManagementDialogStore = create<FileManagementDialogStoreInterface>(
  (set) => ({
    open: false,
    openFileManagementDialog: () => set({ open: true }),
    closeFileManagementDialog: () => set({ open: false }),
  }),
);

export default useFileManagementDialogStore;
