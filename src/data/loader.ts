import { ReadFileResult } from "@capacitor/filesystem";
import { getFilenameFromPath, getFilesystem } from "../utils/filesystem";
import { migrate1 } from "../utils/migrations";
import { getPreferencesItem } from "../utils/preferences";
import { parseTaskList, TaskList } from "../utils/task-list";
import { ThemeMode } from "./AppThemeContext";
import { CloudStorage, CloudStorageClient } from "./CloudStorageContext";
import * as cloudStorage from "./CloudStorageContext/cloud-storage";
import { FilterType, SortKey } from "./FilterContext";
import {
  ArchiveMode,
  getTodoFilePaths,
  Language,
  PriorityTransformation,
  TaskView,
} from "./SettingsContext";

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
  cloudStorageClients: Record<CloudStorage, CloudStorageClient>;
}

async function loadTodoFiles(): Promise<TodoFiles> {
  const filePaths = await getTodoFilePaths();
  const result: TodoFile[] = await Promise.all(
    filePaths.map((filePath) =>
      readFile({
        path: filePath,
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

export async function loader(): Promise<LoaderData> {
  await migrate1();
  return Promise.all([
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
    cloudStorage.loadClients(),
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
      cloudStorageClients,
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
      cloudStorageClients,
    })
  );
}
