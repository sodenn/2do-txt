import { create } from "zustand";

interface FileCreateDialogOptions {
  createFirstTask?: boolean;
  createExampleFile?: boolean;
}

interface FileCreateDialogStoreData extends FileCreateDialogOptions {
  open: boolean;
}

interface FileCreateDialogStoreInterface extends FileCreateDialogStoreData {
  open: boolean;
  openFileCreateDialog: (opt?: FileCreateDialogOptions) => void;
  closeFileCreateDialog: () => void;
  cleanupFileCreateDialog: () => void;
}

const useFileCreateDialogStore = create<FileCreateDialogStoreInterface>(
  (set) => ({
    open: false,
    createFirstTask: false,
    createExampleFile: false,
    openFileCreateDialog: (opt: FileCreateDialogOptions = {}) =>
      set({ ...opt, open: true }),
    closeFileCreateDialog: () =>
      set({
        open: false,
      }),
    cleanupFileCreateDialog: () =>
      set({
        open: false,
        createFirstTask: false,
        createExampleFile: false,
      }),
  }),
);

export default useFileCreateDialogStore;
