import { create } from "zustand";

interface ArchivedTasksDialogState {
  todoFileId?: string;
  open: boolean;
  openArchivedTasksDialog: (todoFileId?: string) => void;
  closeArchivedTasksDialog: () => void;
  cleanupArchivedTasksDialog: () => void;
}

export const useArchivedTasksDialogStore = create<ArchivedTasksDialogState>(
  (set) => ({
    open: false,
    todoFileId: undefined,
    openArchivedTasksDialog: (todoFileId?: string) =>
      set({ todoFileId, open: true }),
    closeArchivedTasksDialog: () => {
      setTimeout(() => {
        set({ open: false, todoFileId: undefined });
      }, 200);
      return set({ open: false });
    },
    cleanupArchivedTasksDialog: () =>
      set({ open: false, todoFileId: undefined }),
  }),
);
