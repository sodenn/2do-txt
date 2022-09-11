import { useCallback } from "react";
import { createContext } from "../utils/Context";
import { usePreferences } from "../utils/prefereneces";

const [MigrationProvider, useMigration] = createContext(() => {
  const { getPreferencesItem, setPreferencesItem, removePreferencesItem } =
    usePreferences();

  const migrate1 = useCallback(async () => {
    const todoFilePath = await getPreferencesItem("todo-txt-path" as any);
    if (todoFilePath) {
      await Promise.all([
        setPreferencesItem("todo-txt-paths", JSON.stringify([todoFilePath])),
        removePreferencesItem("todo-txt-path" as any),
      ]);
    }
  }, [getPreferencesItem, setPreferencesItem, removePreferencesItem]);

  return {
    migrate1,
  };
});

export { MigrationProvider, useMigration };
