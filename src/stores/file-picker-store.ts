import { create } from "zustand";

interface FilePickerStoreInterface {
  fileInput: HTMLInputElement | null;
  setFileInput: (fileInput: HTMLInputElement | null) => void;
}

export const useFilePickerStore = create<FilePickerStoreInterface>((set) => ({
  fileInput: null,
  setFileInput: (fileInput: HTMLInputElement | null) => set({ fileInput }),
}));
