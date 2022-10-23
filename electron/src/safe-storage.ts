import { ipcMain } from "electron";
import Store from "electron-store";
import { safeStorage } from "electron/main";

const store = new Store();

export function setupSafeStorage() {
  ipcMain.handle("getSecureStorageItem", async (event, key) => {
    try {
      const encrypted = store.get(key) as string | undefined;
      if (encrypted) {
        try {
          if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
          } else {
            console.warn("safe storage not available");
            return Buffer.from(encrypted, "base64").toString("utf-8");
          }
        } catch (e) {
          console.warn("Failed to decrypt token", e);
          return Buffer.from(encrypted, "base64").toString("utf-8");
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.handle("setSecureStorageItem", async (event, key, value) => {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value);
        store.set(key, encrypted.toString("base64"));
      } else {
        console.warn("safe storage not available");
        store.set(key, Buffer.from(value).toString("base64"));
      }
    } catch (e) {
      console.error(e);
    }
  });

  ipcMain.handle("removeSecureStorageItem", async (event, key) => {
    try {
      store.delete(key);
    } catch (e) {
      console.error(e);
    }
  });
}
