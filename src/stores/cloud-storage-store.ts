import {
  CloudStorage,
  CloudStorageError,
  createCloudStorage,
  Provider,
} from "@cloudstorage/core";
import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { createDropboxClient } from "../../../cloudstorage/packages/dropbox";
import { createWebDAVClient } from "../../../cloudstorage/packages/webdav";
import { getSecureStorageItem } from "../native-api/secure-storage";
import { cloudStoragePreferences } from "../utils/CloudStorage";

export interface WebDAVConfig {
  baseUrl: string | null;
  basicAuth: {
    username: string | null;
    password: string | null;
  };
}

export async function createWebDAVStorage({
  baseUrl,
  basicAuth: { username, password },
}: WebDAVConfig) {
  if (!username || !password || !baseUrl) {
    throw new CloudStorageError({
      type: "Unauthorized",
      provider: "WebDAV",
    });
  }
  return createCloudStorage({
    client: createWebDAVClient({
      baseUrl,
      basicAuth: {
        username,
        password,
      },
    }),
  });
}

export async function createDropboxStorage(refreshToken: string | null) {
  if (!refreshToken) {
    throw new CloudStorageError({
      type: "Unauthorized",
      provider: "Dropbox",
    });
  }
  return createCloudStorage({
    client: createDropboxClient({
      refreshToken,
    }),
  });
}

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
