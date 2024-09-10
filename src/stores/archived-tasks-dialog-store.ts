import { create } from "zustand";

interface ArchivedTasksDialogState {
  todoFileId?: number;
  open: boolean;
  openArchivedTasksDialog: (todoFileId?: number) => void;
  closeArchivedTasksDialog: () => void;
  cleanupArchivedTasksDialog: () => void;
}

export const useArchivedTasksDialogStore = create<ArchivedTasksDialogState>(
  (set) => ({
    open: false,
    todoFileId: undefined,
    openArchivedTasksDialog: (todoFileId?: number) =>
      set({ todoFileId, open: true }),
    closeArchivedTasksDialog: () => set({ open: false }),
    cleanupArchivedTasksDialog: () =>
      set({ open: false, todoFileId: undefined }),
  }),
);
