import { Storage } from "@capacitor/storage";
import { useCallback } from "react";

export type Keys =
  | "language"
  | "theme-mode"
  | "todo-txt-path"
  | "create-creation-date"
  | "line-ending"
  | "show-notifications"
  | "create-completion-date"
  | "received-notifications"
  | "sort-by"
  | "hide-completed-tasks";

export function useStorage() {
  const getStorageItem = useCallback(async (key: Keys) => {
    const result = await Storage.get({ key });
    if (result) {
      return result.value;
    }
    return null;
  }, []);

  const setStorageItem = useCallback((key: Keys, value: string) => {
    return Storage.set({ key, value: value });
  }, []);

  const removeStorageItem = useCallback((key: Keys) => {
    return Storage.remove({ key });
  }, []);

  return { getStorageItem, setStorageItem, removeStorageItem };
}
