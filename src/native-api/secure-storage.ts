import { invoke } from "@tauri-apps/api/tauri";
import { getPlatform } from "./platform";

export type SecureStorageKeys =
  | "Dropbox-refresh-token"
  | "WebDAV-username"
  | "WebDAV-password"
  | "WebDAV-url";

const prefix = "SecureStorage.";

const iosSecureStorage = {
  async getSecureStorageItem(key: SecureStorageKeys): Promise<string | null> {
    return new Promise((resolve) => {
      // @ts-ignore
      Keychain.get(
        (value: string) => resolve(value),
        () => resolve(null),
        key
      );
    });
  },
  async setSecureStorageItem(key: SecureStorageKeys, value: string) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      Keychain.set(resolve, reject, key, value);
    });
  },
  async removeSecureStorageItem(key: SecureStorageKeys) {
    return new Promise((resolve) => {
      // @ts-ignore
      Keychain.remove(resolve, () => resolve(null), key);
    });
  },
};

const webSecureStorage = {
  async getSecureStorageItem(key: SecureStorageKeys): Promise<string | null> {
    const encodedData = sessionStorage.getItem(prefix + key);
    if (encodedData) {
      return window.atob(encodedData);
    } else {
      return null;
    }
  },
  async setSecureStorageItem(key: SecureStorageKeys, value: string) {
    sessionStorage.setItem(prefix + key, window.btoa(value));
  },
  async removeSecureStorageItem(key: SecureStorageKeys) {
    sessionStorage.removeItem(prefix + key);
  },
};

const desktopSecureStorage = {
  async getSecureStorageItem(key: SecureStorageKeys): Promise<string | null> {
    return invoke("get_secure_storage_item", { key });
  },
  async setSecureStorageItem(key: SecureStorageKeys, value: string) {
    await invoke("set_secure_storage_item", { key, value });
  },
  async removeSecureStorageItem(key: SecureStorageKeys) {
    await invoke("remove_secure_storage_item", { key });
  },
};

async function getSecureStorageItem(
  key: SecureStorageKeys
): Promise<string | null> {
  const platform = getPlatform();
  return platform === "ios"
    ? iosSecureStorage.getSecureStorageItem(key)
    : platform === "desktop"
    ? desktopSecureStorage.getSecureStorageItem(key)
    : webSecureStorage.getSecureStorageItem(key);
}

async function setSecureStorageItem(key: SecureStorageKeys, value: string) {
  const platform = getPlatform();
  return platform === "ios"
    ? iosSecureStorage.setSecureStorageItem(key, value)
    : platform === "desktop"
    ? desktopSecureStorage.setSecureStorageItem(key, value)
    : webSecureStorage.setSecureStorageItem(key, value);
}

async function removeSecureStorageItem(key: SecureStorageKeys) {
  const platform = getPlatform();
  return platform === "ios"
    ? iosSecureStorage.removeSecureStorageItem(key)
    : platform === "desktop"
    ? desktopSecureStorage.removeSecureStorageItem(key)
    : webSecureStorage.removeSecureStorageItem(key);
}

export { getSecureStorageItem, setSecureStorageItem, removeSecureStorageItem };
