import { create } from "zustand";

interface ArchivedTasksDialogOptions {
  filePath?: string;
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
    filePath: undefined,
    openArchivedTasksDialog: (opt: ArchivedTasksDialogOptions = {}) =>
      set({ ...opt, open: true }),
    closeArchivedTasksDialog: () => {
      setTimeout(() => {
        set({ open: false, filePath: undefined });
      }, 200);
      return set({ open: false });
    },
  }));
