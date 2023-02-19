import { create } from "zustand";
import { Task } from "../utils/task";

interface TaskDialogState {
  open: boolean;
  task?: Task;
  openTaskDialog: (task?: Task) => void;
  closeTaskDialog: () => void;
  cleanupTaskDialog: () => void;
}

const useTaskDialog = create<TaskDialogState>((set) => ({
  open: false,
  openTaskDialog: (task?: Task) => set({ open: true, task }),
  closeTaskDialog: () => set((state) => ({ open: false, task: state.task })),
  cleanupTaskDialog: () => set({ open: false }),
}));

export default useTaskDialog;
