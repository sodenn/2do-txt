import { create } from "zustand";

interface WebDAVDialogState {
  open: boolean;
  openCloudFileDialog: () => void;
  closeCloudFileDialog: () => void;
}

const useWebDAVDialogStore = create<WebDAVDialogState>((set) => ({
  open: false,
  openCloudFileDialog: () => set({ open: true }),
  closeCloudFileDialog: () => set({ open: false }),
}));

export default useWebDAVDialogStore;
