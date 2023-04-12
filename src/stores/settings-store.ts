import { getI18n } from "react-i18next";
import { StoreApi, UseBoundStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../native-api/preferences";

export type Language = "de" | "en";

export type ArchiveMode = "no-archiving" | "automatic" | "manual";

export type TaskView = "list" | "timeline";

export type PriorityTransformation = "keep" | "remove" | "archive";

interface SettingsLoaderData {
  createCreationDate: boolean;
  createCompletionDate: boolean;
  showNotifications: boolean;
  archiveMode: ArchiveMode;
  taskView: TaskView;
  priorityTransformation: PriorityTransformation;
  language: Language;
}

interface SettingsState extends SettingsLoaderData {
  init: (data: SettingsLoaderData) => void;
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

export async function settingsLoader(): Promise<SettingsLoaderData> {
  const [
    createCreationDate,
    createCompletionDate,
    showNotifications,
    archiveMode,
    taskView,
    completedTaskPriority,
    language,
  ] = await Promise.all([
    getPreferencesItem("create-creation-date"),
    getPreferencesItem("create-completion-date"),
    getPreferencesItem("show-notifications"),
    getPreferencesItem<ArchiveMode>("archive-mode"),
    getPreferencesItem<TaskView>("task-view"),
    getPreferencesItem<PriorityTransformation>("priority-transformation"),
    getPreferencesItem<Language>("language"),
  ]);
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

export const settingsStore = createStore(
  subscribeWithSelector<SettingsState>((set) => ({
    createCreationDate: true,
    createCompletionDate: true,
    showNotifications: false,
    archiveMode: "no-archiving",
    taskView: "list",
    priorityTransformation: "keep",
    language: "en",
    init: (data: SettingsLoaderData) => set(data),
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

export default useSettingsStore;
