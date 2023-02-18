import { create } from "zustand";

interface FileCreateDialogOptions {
  createFirstTask?: boolean;
  createExampleFile?: boolean;
}

interface FileCreateDialogState extends FileCreateDialogOptions {
  open: boolean;
  openFileCreateDialog: (opt?: FileCreateDialogOptions) => void;
  closeFileCreateDialog: () => void;
  cleanupFileCreateDialog: () => void;
}

const useFileCreateDialog = create<FileCreateDialogState>((set) => ({
  open: false,
  createFirstTask: false,
  createExampleFile: false,
  openFileCreateDialog: (opt: FileCreateDialogOptions = {}) =>
    set({ ...opt, open: true }),
  closeFileCreateDialog: () =>
    set((state) => ({
      fileCreateDialogOpen: false,
      createFirstTask: state.createFirstTask,
      createExampleFile: state.createExampleFile,
    })),
  cleanupFileCreateDialog: () =>
    set({
      open: false,
      createFirstTask: false,
      createExampleFile: false,
    }),
}));

export default useFileCreateDialog;
