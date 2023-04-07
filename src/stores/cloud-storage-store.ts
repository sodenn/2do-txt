import { CloudStorage, Provider } from "@cloudstorage/core";
import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getSecureStorageItem } from "../native-api/secure-storage";
import { cloudStoragePreferences } from "../utils/CloudStorage";
import {
  WebDAVConfig,
  createDropboxStorage,
  createWebDAVStorage,
} from "../utils/CloudStorage/cloud-storages";

interface CloudStorageState {
  authError: boolean;
  connectionError: boolean;
  cloudStorages: CloudStorage[];
  addWebDAVStorage: (config: WebDAVConfig) => Promise<void>;
  addDropboxStorage: (refreshToken: string) => Promise<void>;
  removeStorage: (provider: Provider) => Promise<void>;
  setAuthError: (authError: boolean) => void;
  setConnectionError: (connectionError: boolean) => void;
  load: () => Promise<void>;
}

const cloudStorageStore = createStore<CloudStorageState>((set, get) => ({
  cloudStorages: [],
  authError: false,
  connectionError: false,
  addWebDAVStorage: async (config: WebDAVConfig) => {
    if (get().cloudStorages.some((s) => s.provider === "Dropbox")) {
      return;
    }
    const cloudStorage = await createWebDAVStorage(config);
    set((state) => ({
      cloudStorages: [...state.cloudStorages, cloudStorage],
    }));
  },
  addDropboxStorage: async (refreshToken: string) => {
    if (get().cloudStorages.some((s) => s.provider === "Dropbox")) {
      return;
    }
    const cloudStorage = await createDropboxStorage(refreshToken);
    set((state) => ({
      cloudStorages: [...state.cloudStorages, cloudStorage],
    }));
  },
  removeStorage: async (provider: Provider) => {
    set((state) => ({
      cloudStorages: state.cloudStorages.filter((s) => s.provider !== provider),
    }));
  },
  setAuthError: (authError: boolean) => set({ authError }),
  setConnectionError: (connectionError: boolean) => set({ connectionError }),
  load: async () => {
    const [username, password, baseUrl, refreshToken] = await Promise.all([
      getSecureStorageItem("WebDAV-username"),
      getSecureStorageItem("WebDAV-password"),
      getSecureStorageItem("WebDAV-url"),
      getSecureStorageItem("Dropbox-refresh-token"),
    ]);
    const providers = await cloudStoragePreferences.getProviders();
    const cloudStorages = await Promise.all(
      providers.map((provider) => {
        switch (provider) {
          case "WebDAV":
            return createWebDAVStorage({
              baseUrl,
              basicAuth: { username, password },
            });
          case "Dropbox":
            return createDropboxStorage(refreshToken);
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
      })
    );
    set({ cloudStorages });
  },
}));

const useCloudStorageStore = ((selector: any) =>
  useStore(cloudStorageStore, selector)) as UseBoundStore<
  StoreApi<CloudStorageState>
>;

export { cloudStorageStore };
export default useCloudStorageStore;
