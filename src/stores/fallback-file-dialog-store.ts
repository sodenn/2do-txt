import { TEST_MODE } from "@/utils/platform";
import { create } from "zustand";

type Callback = (result?: {
  id: string;
  filename: string;
  content: string;
}) => void;

interface Options {
  importFile?: boolean;
  suggestedFilename?: string;
  callback?: Callback;
}

interface FallbackFileDialogState extends Options {
  open: boolean;
  fileInput: HTMLInputElement | null;
  openFallbackFileDialog: (options: Options) => void;
  closeFallbackFileDialog: () => void;
  setFileInput: (fileInput: HTMLInputElement | null) => void;
}

export const useFallbackFileDialogStore = create<FallbackFileDialogState>(
  (set, getState) => ({
    open: false,
    importFile: false,
    suggestedFilename: undefined,
    callback: undefined,
    fileInput: null,
    openFallbackFileDialog: (options) => {
      set({ ...options, open: true });
      const fileInput = getState().fileInput;
      if (options.importFile && fileInput && !TEST_MODE) {
        fileInput.click();
      }
    },
    closeFallbackFileDialog: () =>
      set({
        open: false,
        importFile: false,
        callback: undefined,
      }),
    setFileInput: (fileInput: HTMLInputElement | null) => set({ fileInput }),
  }),
);
