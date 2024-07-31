import { create } from "zustand";

interface ArchivedTasksDialogOptions {
  todoFileId?: string;
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
    todoFileId: undefined,
    openArchivedTasksDialog: (opt: ArchivedTasksDialogOptions = {}) =>
      set({ ...opt, open: true }),
    closeArchivedTasksDialog: () => {
      setTimeout(() => {
        set({ open: false, todoFileId: undefined });
      }, 200);
      return set({ open: false });
    },
  }));
