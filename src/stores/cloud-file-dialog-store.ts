import { Provider } from "@cloudstorage/core";
import { create } from "zustand";

interface CloudFileDialogState {
  open: boolean;
  provider?: Provider;
  openCloudFileDialog: (provider?: Provider) => void;
  closeCloudFileDialog: () => void;
  cleanupCloudFileDialog: () => void;
}

const useCloudFileDialogStore = create<CloudFileDialogState>((set) => ({
  open: false,
  provider: undefined,
  openCloudFileDialog: (provider?: Provider) =>
    set((state) => ({ open: true, provider })),
  closeCloudFileDialog: () => set({ open: false }),
  cleanupCloudFileDialog: () => set({ open: false, provider: undefined }),
}));

export default useCloudFileDialogStore;
