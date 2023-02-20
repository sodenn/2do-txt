import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { CloudStorage, CloudStorageClient } from "../utils/CloudStorage";
import { loadClients } from "../utils/CloudStorage/cloud-storage";

interface CloudStorageState {
  authError: boolean;
  connectionError: boolean;
  cloudStorageClients: Record<CloudStorage, CloudStorageClient>;
  setCloudStorageClient: (cloudStorageClient: CloudStorageClient) => void;
  setAuthError: (authError: boolean) => void;
  setConnectionError: (connectionError: boolean) => void;
  load: () => Promise<void>;
}

const cloudStorageStore = createStore<CloudStorageState>((set) => ({
  authError: false,
  connectionError: false,
  cloudStorageClients: {
    Dropbox: { status: "disconnected", cloudStorage: "Dropbox" },
    WebDAV: { status: "disconnected", cloudStorage: "WebDAV" },
  },
  setCloudStorageClient: (cloudStorageClient: CloudStorageClient) => {
    const client: Partial<Record<CloudStorage, CloudStorageClient>> = {
      [cloudStorageClient.cloudStorage]: cloudStorageClient,
    };
    set((state) => ({
      cloudStorageClients: { ...state.cloudStorageClients, ...client },
    }));
  },
  setAuthError: (authError: boolean) => set({ authError }),
  setConnectionError: (connectionError: boolean) => set({ connectionError }),
  load: async () => {
    const cloudStorageClients = await loadClients();
    set({ cloudStorageClients });
  },
}));

const useCloudStorageStore = ((selector: any) =>
  useStore(cloudStorageStore, selector)) as UseBoundStore<
  StoreApi<CloudStorageState>
>;

export { cloudStorageStore };
export default useCloudStorageStore;
