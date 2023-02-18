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

const useArchivedTasksDialog = create<ArchivedTasksDialogState>((set) => ({
  open: false,
  openArchivedTasksDialog: (opt: ArchivedTasksDialogOptions = {}) =>
    set({ ...opt, open: true }),
  closeArchivedTasksDialog: () => set((state) => ({ ...state, open: false })),
  cleanupArchivedTasksDialog: () => set({ open: false }),
}));

export default useArchivedTasksDialog;
