import { create } from "zustand";

interface ArchivedTasksDialogOptions {
  fileId?: string;
}

interface ArchivedTasksDialogStoreData extends ArchivedTasksDialogOptions {
  open: boolean;
}

interface ArchivedTasksDialogStoreInterface
  extends ArchivedTasksDialogStoreData {
  openArchivedTasksDialog: (opt?: ArchivedTasksDialogOptions) => void;
  closeArchivedTasksDialog: () => void;
}

export const useArchivedTasksDialogStore =
  create<ArchivedTasksDialogStoreInterface>((set) => ({
    open: false,
    fileId: undefined,
    openArchivedTasksDialog: (opt: ArchivedTasksDialogOptions = {}) =>
      set({ ...opt, open: true }),
    closeArchivedTasksDialog: () => {
      setTimeout(() => {
        set({ open: false, fileId: undefined });
      }, 200);
      return set({ open: false });
    },
  }));
