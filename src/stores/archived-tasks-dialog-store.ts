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
  cleanupArchivedTasksDialog: () => void;
}

const useArchivedTasksDialogStore = create<ArchivedTasksDialogStoreInterface>(
  (set) => ({
    open: false,
    filePath: undefined,
    openArchivedTasksDialog: (opt: ArchivedTasksDialogOptions = {}) =>
      set({ ...opt, open: true }),
    closeArchivedTasksDialog: () => set({ open: false }),
    cleanupArchivedTasksDialog: () => set({ open: false, filePath: undefined }),
  }),
);

export default useArchivedTasksDialogStore;
