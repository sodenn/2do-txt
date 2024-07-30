export type PreferencesKeys =
  | "language"
  | "theme-mode"
  | "todo-files"
  | "create-creation-date"
  | "archive-mode"
  | "priority-transformation"
  | "show-notifications"
  | "create-completion-date"
  | "received-notifications"
  | "sort-by"
  | "filter-type"
  | "hide-completed-tasks"
  | "task-view";

export async function getPreferencesItem<T extends string>(
  key: PreferencesKeys,
) {
  const value = localStorage.getItem(key);
  if (value) {
    return value as T;
  }
  return null;
}

export async function setPreferencesItem(
  key: PreferencesKeys,
  value: string,
): Promise<void> {
  return localStorage.setItem(key, value);
}

export async function removePreferencesItem(
  key: PreferencesKeys,
): Promise<void> {
  return localStorage.removeItem(key);
}
