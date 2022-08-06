import { Preferences } from "@capacitor/preferences";
import { useCallback } from "react";

export type StorageKeys =
  | "app-rate-counter"
  | "app-rate-date"
  | "language"
  | "theme-mode"
  | "todo-txt-paths"
  | "create-creation-date"
  | "archive-mode"
  | "priority-transformation"
  | "show-notifications"
  | "create-completion-date"
  | "received-notifications"
  | "sort-by"
  | "filter-type"
  | "hide-completed-tasks"
  | "cloud-files"
  | "cloud-archive-files";

export function useStorage() {
  const getStorageItem = useCallback(
    async <T extends string>(key: StorageKeys) => {
      const result = await Preferences.get({ key });
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
      return Preferences.set({ key, value: value });
    },
    []
  );

  const removeStorageItem = useCallback(async (key: StorageKeys) => {
    return Preferences.remove({ key });
  }, []);

  return { getStorageItem, setStorageItem, removeStorageItem };
}
