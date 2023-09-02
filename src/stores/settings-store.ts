import {
  getPreferencesItem,
  setPreferencesItem,
} from "@/native-api/preferences";
import { createContext, useContext } from "react";
import { getI18n } from "react-i18next";
import { useStore as useZustandStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type Language = "de" | "en";

export type ArchiveMode = "no-archiving" | "automatic" | "manual";

export type TaskView = "list" | "timeline";

export type PriorityTransformation = "keep" | "remove" | "archive";

export interface SettingsStoreData {
  createCreationDate: boolean;
  createCompletionDate: boolean;
  showNotifications: boolean;
  archiveMode: ArchiveMode;
  taskView: TaskView;
  priorityTransformation: PriorityTransformation;
  language: Language;
}

interface SettingsStoreInterface extends SettingsStoreData {
  toggleCreateCreationDate: () => void;
  toggleCreateCompletionDate: () => void;
  changeLanguage: (language: Language) => void;
  setShowNotifications: (showNotifications: boolean) => void;
  setArchiveMode: (archiveMode: ArchiveMode) => void;
  setTaskView: (taskView: TaskView) => void;
  setCompletedTaskPriority: (
    priorityTransformation: PriorityTransformation,
  ) => void;
}

function getDefaultInitialState(): SettingsStoreData {
  return {
    createCreationDate: true,
    createCompletionDate: true,
    showNotifications: false,
    archiveMode: "no-archiving",
    taskView: "list",
    priorityTransformation: "keep",
    language: "en",
  };
}

export type SettingsStoreType = ReturnType<typeof initializeSettingsStore>;

const zustandContext = createContext<SettingsStoreType | null>(null);

export const SettingsStoreProvider = zustandContext.Provider;

export async function settingsLoader(): Promise<SettingsStoreData> {
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

export function initializeSettingsStore(
  preloadedState: Partial<SettingsStoreInterface> = {},
) {
  return createStore<SettingsStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
    toggleCreateCreationDate: () =>
      set((state) => {
        const createCreationDate = !state.createCreationDate;
        setPreferencesItem(
          "create-creation-date",
          createCreationDate.toString(),
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
          createCompletionDate.toString(),
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
      priorityTransformation: PriorityTransformation,
    ) => {
      set({ priorityTransformation });
      setPreferencesItem("priority-transformation", priorityTransformation);
    },
  }));
}

export function useSettingsStore<T = SettingsStoreInterface>(
  selector: (state: SettingsStoreInterface) => T = (state) => state as T,
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
