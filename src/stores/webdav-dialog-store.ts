import { create } from "zustand";

interface WebDAVDialogStoreInterface {
  open: boolean;
  openWebDAVDialog: () => void;
  closeWebDAVDialog: () => void;
}

export const useWebDAVDialogStore = create<WebDAVDialogStoreInterface>(
  (set) => ({
    open: false,
    openWebDAVDialog: () => set({ open: true }),
    closeWebDAVDialog: () => set({ open: false }),
  }),
);
