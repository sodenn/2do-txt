import { getPlatform } from "./platform";

export type SecureStorageKeys =
  | "Dropbox-refresh-token"
  | "Dropbox-code-verifier";

const prefix = "SecureStorage.";

const iosSecureStorage = Object.freeze({
  async getSecureStorageItem(key: SecureStorageKeys): Promise<string | null> {
    return new Promise((resolve) => {
      // @ts-ignore
      return Keychain.get(
        (value: string) => resolve(value),
        () => resolve(null),
        key
      );
    });
  },
  async setSecureStorageItem(key: SecureStorageKeys, value: string) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      return Keychain.set(resolve, reject, key, value);
    });
  },
  async removeSecureStorageItem(key: SecureStorageKeys) {
    return new Promise((resolve) => {
      // @ts-ignore
      return Keychain.remove(resolve, () => resolve(null), key);
    });
  },
});

const webSecureStorage = Object.freeze({
  async getSecureStorageItem(key: SecureStorageKeys): Promise<string | null> {
    const encodedData = sessionStorage.getItem(prefix + key);
    if (encodedData) {
      return atob(encodedData);
    } else {
      return null;
    }
  },
  async setSecureStorageItem(key: SecureStorageKeys, value: string) {
    sessionStorage.setItem(prefix + key, btoa(value));
  },
  async removeSecureStorageItem(key: SecureStorageKeys) {
    await sessionStorage.removeItem(prefix + key);
  },
});

const electronSecureStorage = Object.freeze({
  async getSecureStorageItem(key: SecureStorageKeys): Promise<string | null> {
    return window.electron.getSecureStorageItem(key);
  },
  async setSecureStorageItem(key: SecureStorageKeys, value: string) {
    await window.electron.setSecureStorageItem(key, value);
  },
  async removeSecureStorageItem(key: SecureStorageKeys) {
    await window.electron.removeSecureStorageItem(key);
  },
});

export function getSecureStorage() {
  const platform = getPlatform();
  return platform === "ios"
    ? iosSecureStorage
    : platform === "electron"
    ? electronSecureStorage
    : webSecureStorage;
}
