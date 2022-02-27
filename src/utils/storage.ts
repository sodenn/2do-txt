import { Storage } from "@capacitor/storage";
import { useCallback } from "react";

export type StorageKeys =
  | "language"
  | "theme-mode"
  | "todo-txt-paths"
  | "create-creation-date"
  | "show-notifications"
  | "create-completion-date"
  | "received-notifications"
  | "sort-by"
  | "hide-completed-tasks"
  | "cloud-storage"
  | "cloud-files";

export function useStorage() {
  const getStorageItem = useCallback(
    async <T extends string>(key: StorageKeys) => {
      const result = await Storage.get({ key });
      if (result) {
        return result.value as T;
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setStorageItem = useCallback(
    async (key: StorageKeys, value: string) => {
      return Storage.set({ key, value: value });
    },
    []
  );

  const removeStorageItem = useCallback(async (key: StorageKeys) => {
    return Storage.remove({ key });
  }, []);

  return { getStorageItem, setStorageItem, removeStorageItem };
}
