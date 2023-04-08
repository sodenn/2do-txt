import { create } from "zustand";

interface WebDAVDialogState {
  open: boolean;
  openWebDAVDialog: () => void;
  closeWebDAVDialog: () => void;
}

const useWebDAVDialogStore = create<WebDAVDialogState>((set) => ({
  open: false,
  openWebDAVDialog: () => set({ open: true }),
  closeWebDAVDialog: () => set({ open: false }),
}));

export default useWebDAVDialogStore;
