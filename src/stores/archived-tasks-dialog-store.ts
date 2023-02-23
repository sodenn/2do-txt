import { create } from "zustand";

interface ArchivedTasksDialogOptions {
  filePath?: string;
}

interface ArchivedTasksDialogState extends ArchivedTasksDialogOptions {
  open: boolean;
  openArchivedTasksDialog: (opt?: ArchivedTasksDialogOptions) => void;
  closeArchivedTasksDialog: () => void;
  cleanupArchivedTasksDialog: () => void;
}

const useArchivedTasksDialogStore = create<ArchivedTasksDialogState>((set) => ({
  open: false,
  filePath: undefined,
  openArchivedTasksDialog: (opt: ArchivedTasksDialogOptions = {}) =>
    set({ ...opt, open: true }),
  closeArchivedTasksDialog: () => set({ open: false }),
  cleanupArchivedTasksDialog: () => set({ open: false, filePath: undefined }),
}));

export default useArchivedTasksDialogStore;
