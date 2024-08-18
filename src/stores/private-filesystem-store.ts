import { create } from "zustand";

type Callback = (result?: {
  id: number;
  filename: string;
  content: string;
}) => void;

interface Options {
  importFile?: boolean;
  suggestedFilename?: string;
  callback?: Callback;
}

interface PrivateFilesystemState extends Options {
  open: boolean;
  fileInput: HTMLInputElement | null;
  openPrivateFilesystemDialog: (options: Options) => void;
  closePrivateFilesystemDialog: () => void;
  setFileInput: (fileInput: HTMLInputElement | null) => void;
}

export const usePrivateFilesystemStore = create<PrivateFilesystemState>(
  (set, getState) => ({
    open: false,
    importFile: false,
    suggestedFilename: undefined,
    callback: undefined,
    fileInput: null,
    openPrivateFilesystemDialog: (options) => {
      set({ ...options, open: true });
      const fileInput = getState().fileInput;
      if (options.importFile && fileInput) {
        fileInput.click();
      }
    },
    closePrivateFilesystemDialog: () =>
      set({
        open: false,
        importFile: false,
        callback: undefined,
      }),
    setFileInput: (fileInput: HTMLInputElement | null) => set({ fileInput }),
  }),
);
