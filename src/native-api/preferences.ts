import { Preferences } from "@capacitor/preferences";

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
  | "cloud-file-refs"
  | "task-view"
  | "Dropbox-code-verifier";

export async function getPreferencesItem<T extends string>(
  key: PreferencesKeys,
) {
  const result = await Preferences.get({ key });
  if (result) {
    return result.value as T;
  }
  return null;
}

export async function setPreferencesItem(
  key: PreferencesKeys,
  value: string,
): Promise<void> {
  return Preferences.set({ key, value: value });
}

export async function removePreferencesItem(
  key: PreferencesKeys,
): Promise<void> {
  return Preferences.remove({ key });
}
