import { Directory, Encoding, ReadFileResult } from "@capacitor/filesystem";
import { SplashScreen } from "@capacitor/splash-screen";
import { CloudStorage, cloudStorages } from "../types/cloud-storage.types";
import { getFilesystem } from "../utils/filesystem";
import { migrate1 } from "../utils/migrations";
import { getPreferencesItem } from "../utils/preferences";
import { getSecureStorage } from "../utils/secure-storage";
import { ThemeMode } from "./AppThemeContext";
import { FilterType, SortKey } from "./FilterContext";
import {
  ArchiveMode,
  getTodoFilePaths,
  Language,
  PriorityTransformation,
  TaskView,
} from "./SettingsContext";

const { getSecureStorageItem } = getSecureStorage();
const { readFile } = getFilesystem();

export interface TodoFile {
  type: "success";
  path: string;
  file: ReadFileResult;
}

export interface TodoFileError {
  type: "error";
  path: string;
}

export type TodoFileResult = TodoFile | TodoFileError;

export interface LoaderData {
  sortBy: SortKey;
  filterType: FilterType;
  hideCompletedTasks: boolean;
  showNotifications: boolean;
  createCreationDate: boolean;
  createCompletionDate: boolean;
  archiveMode: ArchiveMode;
  taskView: TaskView;
  priorityTransformation: PriorityTransformation;
  language: Language;
  themeMode: ThemeMode;
  todoFiles: TodoFileResult[];
  connectedCloudStorages: Record<CloudStorage, boolean>;
}

async function loadTodoFiles() {
  const filePaths = await getTodoFilePaths();
  const result: TodoFileResult[] = await Promise.all(
    filePaths.map((path) =>
      readFile({
        path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
        .then((file) => ({ type: "success", path, file } as TodoFile))
        .catch(() => ({ type: "error", path } as TodoFileError))
    )
  );
  return {
    result,
  };
}

const loadCloudStorages = () =>
  Promise.all(
    cloudStorages.map((cloudStorage) =>
      getSecureStorageItem(`${cloudStorage}-refresh-token`).then(
        (refreshToken) => ({ cloudStorage, connected: !!refreshToken })
      )
    )
  ).then((result) => ({ result }));

export async function loader(): Promise<LoaderData> {
  await migrate1();
  const data = await Promise.all([
    getPreferencesItem<SortKey>("sort-by"),
    getPreferencesItem<FilterType>("filter-type"),
    getPreferencesItem("hide-completed-tasks"),
    getPreferencesItem("show-notifications"),
    getPreferencesItem("create-creation-date"),
    getPreferencesItem("create-completion-date"),
    getPreferencesItem<ArchiveMode>("archive-mode"),
    getPreferencesItem<TaskView>("task-view"),
    getPreferencesItem<PriorityTransformation>("priority-transformation"),
    getPreferencesItem<Language>("language"),
    getPreferencesItem<ThemeMode>("theme-mode"),
    loadTodoFiles(),
    loadCloudStorages(),
  ]).then(
    ([
      sortBy,
      filterType,
      hideCompletedTasks,
      showNotifications,
      createCreationDate,
      createCompletionDate,
      archiveMode,
      taskView,
      completedTaskPriority,
      language,
      themeMode,
      todoFiles,
      cloudStorages,
    ]) => ({
      sortBy: sortBy ?? "",
      filterType: filterType || "AND",
      hideCompletedTasks: hideCompletedTasks === "true",
      showNotifications: showNotifications === "true",
      createCreationDate:
        createCreationDate === null ? true : createCreationDate === "true",
      createCompletionDate:
        createCompletionDate === null ? true : createCompletionDate === "true",
      archiveMode: archiveMode || "no-archiving",
      taskView: taskView || "list",
      priorityTransformation: completedTaskPriority || "keep",
      language: language || "en",
      themeMode: themeMode || "system",
      todoFiles: todoFiles.result,
      connectedCloudStorages: cloudStorages.result.reduce((prev, curr) => {
        prev[curr.cloudStorage] = curr.connected;
        return prev;
      }, {} as Record<CloudStorage, boolean>),
    })
  );
  await SplashScreen.hide();
  return data;
}
