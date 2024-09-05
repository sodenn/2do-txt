type PreferencesKeys =
  | "language"
  | "theme-mode"
  | "create-creation-date"
  | "archive-mode"
  | "priority-transformation"
  | "show-notifications"
  | "create-completion-date"
  | "delivered-notifications"
  | "sort-by"
  | "filter-type"
  | "hide-completed-tasks"
  | "task-view"
  | "reminder-offset"
  | "selected-task-list-ids"
  | "selected-contexts"
  | "selected-projects"
  | "selected-tags"
  | "selected-priorities";

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
