import { Preferences } from "@capacitor/preferences";
import { useCallback } from "react";

export type PreferencesKeys =
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
  | "cloud-archive-files"
  | "task-view";

export function usePreferences() {
  const getPreferencesItem = useCallback(
    async <T extends string>(key: PreferencesKeys) => {
      const result = await Preferences.get({ key });
      if (result) {
        return result.value as T;
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setPreferencesItem = useCallback(
    async (key: PreferencesKeys, value: string) => {
      return Preferences.set({ key, value: value });
    },
    []
  );

  const removePreferencesItem = useCallback(async (key: PreferencesKeys) => {
    return Preferences.remove({ key });
  }, []);

  return { getPreferencesItem, setPreferencesItem, removePreferencesItem };
}
