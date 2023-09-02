import { Provider } from "@/utils/CloudStorage";
import { create } from "zustand";

interface CloudFileDialogStoreInterface {
  open: boolean;
  provider?: Provider;
  openCloudFileDialog: (provider?: Provider) => void;
  closeCloudFileDialog: () => void;
  cleanupCloudFileDialog: () => void;
}

export const useCloudFileDialogStore = create<CloudFileDialogStoreInterface>(
  (set) => ({
    open: false,
    provider: undefined,
    openCloudFileDialog: (provider?: Provider) => set({ open: true, provider }),
    closeCloudFileDialog: () => set({ open: false }),
    cleanupCloudFileDialog: () => set({ open: false, provider: undefined }),
  }),
);
