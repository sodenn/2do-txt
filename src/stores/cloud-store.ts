import { getSecureStorageItem } from "@/native-api/secure-storage";
import {
  CloudStorage,
  Provider,
  WebDAVClientOptions,
  createDropboxStorage,
  createWebDAVStorage,
} from "@/utils/CloudStorage";
import { createContext, useContext } from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface CloudStoreData {
  authError: boolean;
  cloudStorages: CloudStorage[];
}

interface CloudStoreInterface extends CloudStoreData {
  addWebDAVStorage: (config: WebDAVClientOptions) => Promise<CloudStorage>;
  addDropboxStorage: (refreshToken: string) => Promise<CloudStorage>;
  removeStorage: (provider: Provider) => Promise<void>;
  setAuthError: (authError: boolean) => void;
}

export interface CloudLoaderData {
  webDAV: {
    baseUrl: string | null;
    username: string | null;
    password: string | null;
  };
  dropbox: {
    refreshToken: string | null;
  };
}

function getDefaultInitialState(): CloudStoreData {
  return {
    cloudStorages: [],
    authError: false,
  };
}

export type CloudStoreType = ReturnType<typeof initializeCloudStore>;

const zustandContext = createContext<CloudStoreType | null>(null);

export const CloudStoreProvider = zustandContext.Provider;

export async function cloudLoader(): Promise<CloudLoaderData> {
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

export function initializeCloudStore({
  webDAV,
  dropbox,
}: Partial<CloudLoaderData>) {
  const cloudStorages: CloudStorage[] = [];
  if (webDAV?.username && webDAV?.password && webDAV?.baseUrl) {
    cloudStorages.push(
      createWebDAVStorage({
        baseUrl: webDAV.baseUrl,
        basicAuth: { username: webDAV.username, password: webDAV.password },
      }),
    );
  }
  if (dropbox?.refreshToken) {
    cloudStorages.push(createDropboxStorage(dropbox.refreshToken));
  }
  return createStore<CloudStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    cloudStorages,
    addWebDAVStorage: async (config: WebDAVClientOptions) => {
      const cloudStorage = createWebDAVStorage(config);
      await cloudStorage.list({ path: "" });
      set((state) => ({
        cloudStorages: state.cloudStorages.some((s) => s.provider === "WebDAV")
          ? state.cloudStorages.map((s) =>
              s.provider === "WebDAV" ? cloudStorage : s,
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
              s.provider === "Dropbox" ? cloudStorage : s,
            )
          : [...state.cloudStorages, cloudStorage],
      }));
      return cloudStorage;
    },
    removeStorage: async (provider: Provider) => {
      set((state) => ({
        cloudStorages: state.cloudStorages.filter(
          (s) => s.provider !== provider,
        ),
      }));
    },
    setAuthError: (authError: boolean) => set({ authError }),
  }));
}

export function useCloudStore<T>(selector: (state: CloudStoreInterface) => T) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
