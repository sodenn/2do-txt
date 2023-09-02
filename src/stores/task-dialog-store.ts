import { Task } from "@/utils/task";
import { create } from "zustand";

interface TaskDialogStoreInterface {
  open: boolean;
  task?: Task;
  openTaskDialog: (task?: Task) => void;
  closeTaskDialog: () => void;
  cleanupTaskDialog: () => void;
}

export const useTaskDialogStore = create<TaskDialogStoreInterface>((set) => ({
  open: false,
  task: undefined,
  openTaskDialog: (task?: Task) => set({ open: true, task }),
  closeTaskDialog: () => set((state) => ({ open: false, task: state.task })),
  cleanupTaskDialog: () => set({ open: false, task: undefined }),
}));
