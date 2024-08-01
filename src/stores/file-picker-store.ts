import { create } from "zustand";

interface FilePickerState {
  fileInput: HTMLInputElement | null;
  setFileInput: (fileInput: HTMLInputElement | null) => void;
}

export const useFilePickerStore = create<FilePickerState>((set) => ({
  fileInput: null,
  setFileInput: (fileInput: HTMLInputElement | null) => set({ fileInput }),
}));
