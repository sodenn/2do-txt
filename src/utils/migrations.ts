import {
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "./preferences";

export async function migrate1() {
  const todoFilePath = await getPreferencesItem("todo-txt-path" as any);
  if (todoFilePath) {
    await Promise.all([
      setPreferencesItem("todo-txt-paths", JSON.stringify([todoFilePath])),
      removePreferencesItem("todo-txt-path" as any),
    ]);
  }
}
