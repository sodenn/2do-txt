import { Directory, Encoding, ReadFileResult } from "@capacitor/filesystem";
import { SplashScreen } from "@capacitor/splash-screen";
import { CloudStorage, cloudStorages } from "../types/cloud-storage.types";
import { getFilenameFromPath, getFilesystem } from "../utils/filesystem";
import { migrate1 } from "../utils/migrations";
import { getPreferencesItem } from "../utils/preferences";
import { getSecureStorage } from "../utils/secure-storage";
import { parseTaskList, TaskList } from "../utils/task-list";
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

interface TodoFileSuccess {
  type: "success";
  filePath: string;
  file: ReadFileResult;
}

interface TodoFileError {
  type: "error";
  filePath: string;
}

type TodoFile = TodoFileSuccess | TodoFileError;

interface TodoFiles {
  files: { taskList: TaskList; filePath: string; text: string }[];
  errors: TodoFileError[];
}

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
  todoFiles: TodoFiles;
  connectedCloudStorages: Record<CloudStorage, boolean>;
}

async function loadTodoFiles(): Promise<TodoFiles> {
  const filePaths = await getTodoFilePaths();
  const result: TodoFile[] = await Promise.all(
    filePaths.map((filePath) =>
      readFile({
        path: filePath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
        .then(
          (file) => ({ type: "success", filePath, file } as TodoFileSuccess)
        )
        .catch(() => ({ type: "error", filePath } as TodoFileError))
    )
  );
  const files = result
    .filter((i): i is TodoFileSuccess => i.type === "success")
    .map((i) => {
      const text = i.file.data;
      const filePath = i.filePath;
      const parseResult = parseTaskList(text);
      const fileName = getFilenameFromPath(filePath);
      const taskList: TaskList = {
        ...parseResult,
        filePath,
        fileName,
      };
      return { taskList, filePath, text };
    });
  const errors = result.filter((i): i is TodoFileError => i.type === "error");
  return {
    files,
    errors,
  };
}

function loadCloudStorages() {
  return Promise.all(
    cloudStorages.map((cloudStorage) =>
      getSecureStorageItem(`${cloudStorage}-refresh-token`).then(
        (refreshToken) => ({ cloudStorage, connected: !!refreshToken })
      )
    )
  ).then((result) => ({ result }));
}

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
      todoFiles: todoFiles,
      connectedCloudStorages: cloudStorages.result.reduce((prev, curr) => {
        prev[curr.cloudStorage] = curr.connected;
        return prev;
      }, {} as Record<CloudStorage, boolean>),
    })
  );
  await SplashScreen.hide();
  return data;
}
