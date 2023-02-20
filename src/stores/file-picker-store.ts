import { create } from "zustand";

interface FilePickerState {
  fileInput: HTMLInputElement | null;
  setFileInput: (fileInput: HTMLInputElement | null) => void;
}

const useFilePickerStore = create<FilePickerState>((set) => ({
  fileInput: null,
  setFileInput: (fileInput: HTMLInputElement | null) => set({ fileInput }),
}));

export default useFilePickerStore;
