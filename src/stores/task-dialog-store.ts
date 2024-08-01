import { Task } from "@/utils/task";
import { create } from "zustand";

interface TaskDialogState {
  open: boolean;
  task?: Task;
  openTaskDialog: (task?: Task) => void;
  closeTaskDialog: () => void;
  cleanupTaskDialog: () => void;
}

export const useTaskDialogStore = create<TaskDialogState>((set) => ({
  open: false,
  task: undefined,
  openTaskDialog: (task?: Task) => set({ open: true, task }),
  closeTaskDialog: () => set({ open: false }),
  cleanupTaskDialog: () => set({ open: false, task: undefined }),
}));
