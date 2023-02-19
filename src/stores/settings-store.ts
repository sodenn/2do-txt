import { getI18n } from "react-i18next";
import { StoreApi, UseBoundStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { getPreferencesItem, setPreferencesItem } from "../utils/preferences";

type Language = "de" | "en";

type ArchiveMode = "no-archiving" | "automatic" | "manual";

type TaskView = "list" | "timeline";

type PriorityTransformation = "keep" | "remove" | "archive";

interface SettingsState {
  init: () => Promise<void>;
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

const settingsStore = createStore(
  subscribeWithSelector<SettingsState>((set) => ({
    createCreationDate: true,
    createCompletionDate: true,
    showNotifications: false,
    archiveMode: "no-archiving",
    taskView: "list",
    priorityTransformation: "keep",
    language: "en",
    init: async () => {
      const createCreationDate = await getPreferencesItem(
        "create-creation-date"
      );
      const createCompletionDate = await getPreferencesItem(
        "create-completion-date"
      );
      const showNotifications = await getPreferencesItem("show-notifications");
      const archiveMode = await getPreferencesItem<ArchiveMode>("archive-mode");
      const taskView = await getPreferencesItem<TaskView>("task-view");
      const completedTaskPriority =
        await getPreferencesItem<PriorityTransformation>(
          "priority-transformation"
        );
      const language = await getPreferencesItem<Language>("language");
      set((state) => ({
        ...state,
        showNotifications: showNotifications === "true",
        createCreationDate:
          createCreationDate === null ? true : createCreationDate === "true",
        createCompletionDate:
          createCompletionDate === null
            ? true
            : createCompletionDate === "true",
        archiveMode: archiveMode || "no-archiving",
        taskView: taskView || "list",
        priorityTransformation: completedTaskPriority || "keep",
        language: language || "en",
      }));
    },
    toggleCreateCreationDate: () =>
      set((state) => {
        const createCreationDate = !state.createCreationDate;
        setPreferencesItem(
          "create-creation-date",
          createCreationDate.toString()
        );
        return {
          ...state,
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
          ...state,
          createCompletionDate,
        };
      }),
    changeLanguage: (language: Language) => {
      setPreferencesItem("language", language);
      getI18n().changeLanguage(language);
      set((state) => ({ ...state, language }));
    },
    setShowNotifications: (showNotifications: boolean) => {
      set((state) => ({ ...state, showNotifications }));
      setPreferencesItem("show-notifications", showNotifications.toString());
    },
    setArchiveMode: (archiveMode: ArchiveMode) => {
      set((state) => ({ ...state, archiveMode }));
      setPreferencesItem("archive-mode", archiveMode);
    },
    setTaskView: (taskView: TaskView) => {
      set((state) => ({ ...state, taskView }));
      setPreferencesItem("task-view", taskView);
    },
    setCompletedTaskPriority: (
      priorityTransformation: PriorityTransformation
    ) => {
      set((state) => ({ ...state, priorityTransformation }));
      setPreferencesItem("priority-transformation", priorityTransformation);
    },
  }))
);

const useSettings = ((selector: any) =>
  useStore(settingsStore, selector)) as UseBoundStore<StoreApi<SettingsState>>;

async function getTodoFilePaths() {
  const pathStr = await getPreferencesItem("todo-txt-paths");
  try {
    const paths: string[] = pathStr ? JSON.parse(pathStr) : [];
    return paths;
  } catch (e) {
    await setPreferencesItem("todo-txt-paths", JSON.stringify([]));
    return [];
  }
}

async function addTodoFilePath(filePath: string) {
  const filePathsStr = await getPreferencesItem("todo-txt-paths");

  let filePaths: string[] = [];
  try {
    if (filePathsStr) {
      filePaths = JSON.parse(filePathsStr);
    }
  } catch (e) {
    //
  }

  const alreadyExists = filePaths.some((p) => p === filePath);

  if (alreadyExists) {
    return;
  }

  await setPreferencesItem(
    "todo-txt-paths",
    JSON.stringify([...filePaths, filePath])
  );
}

async function removeTodoFilePath(filePath: string) {
  const filePathsStr = await getPreferencesItem("todo-txt-paths");
  let updatedFilePathsStr = JSON.stringify([]);

  if (filePathsStr) {
    try {
      const filePaths: string[] = JSON.parse(filePathsStr);
      const updatedFilePaths = filePaths.filter((path) => path !== filePath);
      updatedFilePathsStr = JSON.stringify(updatedFilePaths);
    } catch (e) {
      //
    }
  }

  await setPreferencesItem("todo-txt-paths", updatedFilePathsStr);
}

export type { Language, ArchiveMode, TaskView, PriorityTransformation };
export { settingsStore, getTodoFilePaths, addTodoFilePath, removeTodoFilePath };
export default useSettings;
