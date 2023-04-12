import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getSecureStorageItem } from "../native-api/secure-storage";
import {
  CloudStorage,
  Provider,
  WebDAVClientOptions,
  createDropboxStorage,
  createWebDAVStorage,
} from "../utils/CloudStorage";

interface CloudStorageState {
  authError: boolean;
  connectionError: boolean;
  cloudStorages: CloudStorage[];
  addWebDAVStorage: (config: WebDAVClientOptions) => Promise<CloudStorage>;
  addDropboxStorage: (refreshToken: string) => Promise<CloudStorage>;
  removeStorage: (provider: Provider) => Promise<void>;
  setAuthError: (authError: boolean) => void;
  setConnectionError: (connectionError: boolean) => void;
  init: (data: CloudStorageLoaderData) => void;
}

interface CloudStorageLoaderData {
  webDAV: {
    baseUrl: string | null;
    username: string | null;
    password: string | null;
  };
  dropbox: {
    refreshToken: string | null;
  };
}

export async function cloudStorageLoader(): Promise<CloudStorageLoaderData> {
  const [username, password, baseUrl, refreshToken] = await Promise.all([
    getSecureStorageItem("WebDAV-username"),
    getSecureStorageItem("WebDAV-password"),
    getSecureStorageItem("WebDAV-url"),
    getSecureStorageItem("Dropbox-refresh-token"),
  ]);
  return {
    webDAV: {
      baseUrl,
      username,
      password,
    },
    dropbox: {
      refreshToken,
    },
  };
}

export const cloudStorageStore = createStore<CloudStorageState>((set, get) => ({
  cloudStorages: [],
  authError: false,
  connectionError: false,
  addWebDAVStorage: async (config: WebDAVClientOptions) => {
    const cloudStorage = createWebDAVStorage(config);
    await cloudStorage.list({ path: "" });
    set((state) => ({
      cloudStorages: state.cloudStorages.some((s) => s.provider === "WebDAV")
        ? state.cloudStorages.map((s) =>
            s.provider === "WebDAV" ? cloudStorage : s
          )
        : [...state.cloudStorages, cloudStorage],
    }));
    return cloudStorage;
  },
  addDropboxStorage: async (refreshToken: string) => {
    const cloudStorage = createDropboxStorage(refreshToken);
    await cloudStorage.list({ path: "" });
    set((state) => ({
      cloudStorages: state.cloudStorages.some((s) => s.provider === "Dropbox")
        ? state.cloudStorages.map((s) =>
            s.provider === "Dropbox" ? cloudStorage : s
          )
        : [...state.cloudStorages, cloudStorage],
    }));
    return cloudStorage;
  },
  removeStorage: async (provider: Provider) => {
    set((state) => ({
      cloudStorages: state.cloudStorages.filter((s) => s.provider !== provider),
    }));
  },
  setAuthError: (authError: boolean) => set({ authError }),
  setConnectionError: (connectionError: boolean) => set({ connectionError }),
  init: (data: CloudStorageLoaderData) => {
    const cloudStorages: CloudStorage[] = [];

    const { username, password, baseUrl } = data.webDAV;
    if (username && password && baseUrl) {
      cloudStorages.push(
        createWebDAVStorage({
          baseUrl,
          basicAuth: { username, password },
        })
      );
    }

    const { refreshToken } = data.dropbox;
    if (refreshToken) {
      cloudStorages.push(createDropboxStorage(refreshToken));
    }

    set({ cloudStorages });
  },
}));

const useCloudStorageStore = ((selector: any) =>
  useStore(cloudStorageStore, selector)) as UseBoundStore<
  StoreApi<CloudStorageState>
>;

export default useCloudStorageStore;
