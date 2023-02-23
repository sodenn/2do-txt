import { getI18n } from "react-i18next";
import { StoreApi, UseBoundStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../native-api/preferences";

type Language = "de" | "en";

type ArchiveMode = "no-archiving" | "automatic" | "manual";

type TaskView = "list" | "timeline";

type PriorityTransformation = "keep" | "remove" | "archive";

interface SettingsState {
  load: () => Promise<void>;
  createCreationDate: boolean;
  createCompletionDate: boolean;
  showNotifications: boolean;
  archiveMode: ArchiveMode;
  taskView: TaskView;
  priorityTransformation: PriorityTransformation;
  language: Language;
  toggleCreateCreationDate: () => void;
  toggleCreateCompletionDate: () => void;
  changeLanguage: (language: Language) => void;
  setShowNotifications: (showNotifications: boolean) => void;
  setArchiveMode: (archiveMode: ArchiveMode) => void;
  setTaskView: (taskView: TaskView) => void;
  setCompletedTaskPriority: (
    priorityTransformation: PriorityTransformation
  ) => void;
}

async function load() {
  const createCreationDate = await getPreferencesItem("create-creation-date");
  const createCompletionDate = await getPreferencesItem(
    "create-completion-date"
  );
  const showNotifications = await getPreferencesItem("show-notifications");
  const archiveMode = await getPreferencesItem<ArchiveMode>("archive-mode");
  const taskView = await getPreferencesItem<TaskView>("task-view");
  const completedTaskPriority =
    await getPreferencesItem<PriorityTransformation>("priority-transformation");
  const language = await getPreferencesItem<Language>("language");
  return {
    showNotifications: showNotifications === "true",
    createCreationDate:
      createCreationDate === null ? true : createCreationDate === "true",
    createCompletionDate:
      createCompletionDate === null ? true : createCompletionDate === "true",
    archiveMode: archiveMode || "no-archiving",
    taskView: taskView || "list",
    priorityTransformation: completedTaskPriority || "keep",
    language: language || "en",
  };
}

const settingsStore = createStore(
  subscribeWithSelector<SettingsState>((set) => ({
    createCreationDate: true,
    createCompletionDate: true,
    showNotifications: false,
    archiveMode: "no-archiving",
    taskView: "list",
    priorityTransformation: "keep",
    language: "en",
    load: async () => {
      const state = await load();
      set(state);
    },
    toggleCreateCreationDate: () =>
      set((state) => {
        const createCreationDate = !state.createCreationDate;
        setPreferencesItem(
          "create-creation-date",
          createCreationDate.toString()
        );
        return {
          createCreationDate,
        };
      }),
    toggleCreateCompletionDate: () =>
      set((state) => {
        const createCompletionDate = !state.createCompletionDate;
        setPreferencesItem(
          "create-completion-date",
          createCompletionDate.toString()
        );
        return {
          createCompletionDate,
        };
      }),
    changeLanguage: (language: Language) => {
      setPreferencesItem("language", language);
      getI18n().changeLanguage(language);
      set({ language });
    },
    setShowNotifications: (showNotifications: boolean) => {
      set({ showNotifications });
      setPreferencesItem("show-notifications", showNotifications.toString());
    },
    setArchiveMode: (archiveMode: ArchiveMode) => {
      set({ archiveMode });
      setPreferencesItem("archive-mode", archiveMode);
    },
    setTaskView: (taskView: TaskView) => {
      set({ taskView });
      setPreferencesItem("task-view", taskView);
    },
    setCompletedTaskPriority: (
      priorityTransformation: PriorityTransformation
    ) => {
      set({ priorityTransformation });
      setPreferencesItem("priority-transformation", priorityTransformation);
    },
  }))
);

const useSettingsStore = ((selector: any) =>
  useStore(settingsStore, selector)) as UseBoundStore<StoreApi<SettingsState>>;

export type { Language, ArchiveMode, TaskView, PriorityTransformation };
export { settingsStore };
export default useSettingsStore;
