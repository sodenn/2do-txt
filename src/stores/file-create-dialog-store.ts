import { create } from "zustand";

type Callback = (result?: {
  id: string;
  filename: string;
  content: string;
}) => void;

interface Options {
  suggestedFilename?: string;
  callback?: Callback;
}

interface FileCreateDialogState extends Options {
  open: boolean;
  openFileCreateDialog: (options: Options) => void;
  closeFileCreateDialog: () => void;
  cleanupFileCreateDialog: () => void;
}

export const useFileCreateDialogStore = create<FileCreateDialogState>(
  (set) => ({
    open: false,
    suggestedFilename: undefined,
    callback: undefined,
    openFileCreateDialog: (options) => set({ ...options, open: true }),
    closeFileCreateDialog: () =>
      set({
        open: false,
      }),
    cleanupFileCreateDialog: () =>
      set({
        suggestedFilename: undefined,
        callback: undefined,
      }),
  }),
);
