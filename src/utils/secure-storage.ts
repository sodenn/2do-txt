import { Keychain } from "@awesome-cordova-plugins/keychain";
import { useCallback } from "react";
import { usePlatform } from "./platform";

export type Keys = "Dropbox-refresh-token" | "Dropbox-code-verifier";

export function useSecureStorage() {
  const platform = usePlatform();
  const iosSecureStorage = useIosSecureStorage();
  const webSecureStorage = useWebSecureStorage();

  if (platform === "ios") {
    return iosSecureStorage;
  }

  if (platform === "web") {
    return webSecureStorage;
  }

  return {
    getSecureStorageItem: async () => {
      console.debug(`useSecureStorage: Unsupported platform "${platform}"`);
      //return process.env.REACT_APP_CLOUD_STORAGE_DEBUG_ACCESS_TOKEN;
    },
    setSecureStorageItem: async () => {
      console.debug(`useSecureStorage: Unsupported platform "${platform}"`);
    },
    removeSecureStorageItem: async () => {
      console.debug(`useSecureStorage: Unsupported platform "${platform}"`);
    },
  };
}

function useWebSecureStorage() {
  const prefix = "SecureStorage.";

  const getSecureStorageItem = useCallback(
    async (key: Keys): Promise<string | null> => {
      const encodedData = sessionStorage.getItem(prefix + key);
      if (encodedData) {
        return atob(encodedData);
      } else {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setSecureStorageItem = useCallback(async (key: Keys, value: string) => {
    sessionStorage.setItem(prefix + key, btoa(value));
  }, []);

  const removeSecureStorageItem = useCallback(async (key: Keys) => {
    await sessionStorage.removeItem(prefix + key);
  }, []);

  return {
    getSecureStorageItem,
    setSecureStorageItem,
    removeSecureStorageItem,
  };
}

function useIosSecureStorage() {
  const getSecureStorageItem = useCallback(
    (key: Keys): Promise<string | null> => {
      return Keychain.get(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setSecureStorageItem = useCallback(async (key: Keys, value: string) => {
    await Keychain.set(key, value);
  }, []);

  const removeSecureStorageItem = useCallback(async (key: Keys) => {
    await Keychain.remove(key);
  }, []);

  return {
    getSecureStorageItem,
    setSecureStorageItem,
    removeSecureStorageItem,
  };
}
