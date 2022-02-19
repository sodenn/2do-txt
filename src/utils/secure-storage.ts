import { Keychain } from "@awesome-cordova-plugins/keychain";
import { useCallback, useState } from "react";
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
  const [trigger, setTrigger] = useState(0);

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
    [trigger]
  );

  const setSecureStorageItem = useCallback(
    async (key: Keys, value: string) => {
      const currentValue = await getSecureStorageItem(key);
      if (currentValue !== value) {
        setTrigger((val) => val + 1);
      }
      sessionStorage.setItem(prefix + key, btoa(value));
    },
    [getSecureStorageItem]
  );

  const removeSecureStorageItem = useCallback(async (key: Keys) => {
    const currentValue = await getSecureStorageItem(key);
    if (!!currentValue) {
      setTrigger((val) => val + 1);
    }
    await sessionStorage.removeItem(prefix + key);
  }, []);

  return {
    getSecureStorageItem,
    setSecureStorageItem,
    removeSecureStorageItem,
  };
}

function useIosSecureStorage() {
  const [trigger, setTrigger] = useState(0);

  const getSecureStorageItem = useCallback(
    (key: Keys): Promise<string | null> => {
      return Keychain.get(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger]
  );

  const setSecureStorageItem = useCallback(
    async (key: Keys, value: string) => {
      setTrigger((val) => val + 1);
      const currentValue = await getSecureStorageItem(key);
      if (currentValue !== value) {
        setTrigger((val) => val + 1);
      }
      await Keychain.set(key, value);
    },
    [getSecureStorageItem]
  );

  const removeSecureStorageItem = useCallback(async (key: Keys) => {
    setTrigger((val) => val + 1);
    await Keychain.remove(key);
  }, []);

  return {
    getSecureStorageItem,
    setSecureStorageItem,
    removeSecureStorageItem,
  };
}
