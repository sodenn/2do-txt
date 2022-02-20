import { Keychain } from "@awesome-cordova-plugins/keychain";
import { useCallback } from "react";
import { usePlatform } from "./platform";

export type SecureStorageKeys =
  | "Dropbox-refresh-token"
  | "Dropbox-code-verifier";

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
    async (key: SecureStorageKeys): Promise<string | null> => {
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

  const setSecureStorageItem = useCallback(
    async (key: SecureStorageKeys, value: string) => {
      sessionStorage.setItem(prefix + key, btoa(value));
    },
    []
  );

  const removeSecureStorageItem = useCallback(
    async (key: SecureStorageKeys) => {
      await sessionStorage.removeItem(prefix + key);
    },
    []
  );

  return {
    getSecureStorageItem,
    setSecureStorageItem,
    removeSecureStorageItem,
  };
}

function useIosSecureStorage() {
  const getSecureStorageItem = useCallback(
    (key: SecureStorageKeys): Promise<string | null> => {
      return Keychain.get(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setSecureStorageItem = useCallback(
    async (key: SecureStorageKeys, value: string) => {
      await Keychain.set(key, value);
    },
    []
  );

  const removeSecureStorageItem = useCallback(
    async (key: SecureStorageKeys) => {
      await Keychain.remove(key);
    },
    []
  );

  return {
    getSecureStorageItem,
    setSecureStorageItem,
    removeSecureStorageItem,
  };
}
