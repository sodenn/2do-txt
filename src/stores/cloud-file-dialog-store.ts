import { create } from "zustand";
import { CloudStorage } from "../utils/CloudStorage";

interface CloudFileDialogState {
  open: boolean;
  cloudStorage?: CloudStorage;
  openCloudFileDialog: (cloudStorage?: CloudStorage) => void;
  closeCloudFileDialog: () => void;
  cleanupCloudFileDialog: () => void;
}

const useCloudFileDialogStore = create<CloudFileDialogState>((set) => ({
  open: false,
  cloudStorage: undefined,
  openCloudFileDialog: (cloudStorage?: CloudStorage) =>
    set((state) => ({ open: true, cloudStorage })),
  closeCloudFileDialog: () => set({ open: false }),
  cleanupCloudFileDialog: () => set({ open: false, cloudStorage: undefined }),
}));

export default useCloudFileDialogStore;
