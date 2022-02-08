import { useCallback } from "react";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

const [MigrationProvider, useMigration] = createContext(() => {
  const { getStorageItem, setStorageItem, removeStorageItem } = useStorage();

  const migrate1 = useCallback(async () => {
    const todoFilePath = await getStorageItem("todo-txt-path" as any);
    if (todoFilePath) {
      await Promise.all([
        setStorageItem("todo-txt-paths", JSON.stringify([todoFilePath])),
        removeStorageItem("todo-txt-path" as any),
      ]);
    }
  }, [getStorageItem, setStorageItem, removeStorageItem]);

  return {
    migrate1,
  };
});

export { MigrationProvider, useMigration };
