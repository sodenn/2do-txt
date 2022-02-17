import { Storage } from "@capacitor/storage";
import { useCallback, useState } from "react";

export type Keys =
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
  | "Dropbox-files";

export function useStorage() {
  const [trigger, setTrigger] = useState(0);

  const getStorageItem = useCallback(
    async <T extends string>(key: Keys) => {
      const result = await Storage.get({ key });
      if (result) {
        return result.value as T;
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger]
  );

  const setStorageItem = useCallback(
    async (key: Keys, value: string) => {
      const currentValue = await getStorageItem(key);
      if (currentValue !== value) {
        setTrigger((val) => val + 1);
      }
      return Storage.set({ key, value: value });
    },
    [getStorageItem]
  );

  const removeStorageItem = useCallback((key: Keys) => {
    setTrigger((val) => val + 1);
    return Storage.remove({ key });
  }, []);

  return { getStorageItem, setStorageItem, removeStorageItem };
}
