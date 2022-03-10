import { Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { todayDate } from "../utils/date";
import { getFilenameFromPath, useFilesystem } from "../utils/filesystem";
import { hashCode } from "../utils/hashcode";
import { useNotifications } from "../utils/notifications";
import { usePlatform } from "../utils/platform";
import { useStorage } from "../utils/storage";
import {
  createDueDateRegex,
  parseTaskBody,
  stringifyTask,
  Task,
  TaskFormData,
} from "../utils/task";
import {
  getCommonTaskListAttributes,
  parseTaskList,
  stringifyTaskList,
  TaskListParseResult,
} from "../utils/task-list";
import { generateId } from "../utils/uuid";
import { SyncFileOptions, useCloudStorage } from "./CloudStorageContext";
import { useConfirmationDialog } from "./ConfirmationDialogContext";
import { useFilter } from "./FilterContext";
import { useMigration } from "./MigrationContext";
import { useSettings } from "./SettingsContext";

export const defaultTodoFilePath = "todo.txt";

export interface TaskListState extends TaskListParseResult {
  tasksLoaded: boolean;
  filePath: string;
  fileName: string;
}

interface State {
  init: boolean;
  taskLists: TaskListState[];
}

const [TaskProvider, useTask] = createContext(() => {
  const { getUri, readFile, writeFile, deleteFile, isFile } = useFilesystem();
  const { setStorageItem } = useStorage();
  const { migrate1 } = useMigration();
  const { enqueueSnackbar } = useSnackbar();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { addTodoFilePath } = useSettings();
  const { syncAllFile, syncFileThrottled, unlinkFile, cloudStorageEnabled } =
    useCloudStorage();
  const {
    scheduleNotifications,
    cancelNotifications,
    shouldNotificationsBeRescheduled,
  } = useNotifications();
  const { t } = useTranslation();
  const platform = usePlatform();
  const {
    showNotifications,
    createCompletionDate,
    removeTodoFilePath,
    getTodoFilePaths,
  } = useSettings();
  const { activeTaskListPath, setActiveTaskListPath } = useFilter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({
    init: false,
    taskLists: [],
  });

  const { init, taskLists } = state;

  const commonTaskListAttributes = getCommonTaskListAttributes(taskLists);

  const activeTaskList = activeTaskListPath
    ? taskLists.find((list) => list.filePath === activeTaskListPath)
    : taskLists.length === 1
    ? taskLists[0]
    : undefined;

  const findTaskListByTaskId = useCallback(
    (taskId?: string) => {
      if (!taskId) {
        return;
      }
      return taskLists.find((list) => list.items.some((i) => i._id === taskId));
    },
    [taskLists]
  );

  const toTaskList = useCallback((filePath: string, text: string) => {
    const parseResult = parseTaskList(text);

    const fileName = getFilenameFromPath(filePath);

    const taskList: TaskListState = {
      ...parseResult,
      filePath,
      fileName,
      tasksLoaded: true,
    };

    return taskList;
  }, []);

  const loadTodoFile = useCallback(
    async (filePath: string, text: string) => {
      const taskList = toTaskList(filePath, text);
      setState((state) => {
        const taskLists = state.taskLists.some(
          (t) => t.filePath === taskList.filePath
        )
          ? state.taskLists.map((t) =>
              t.filePath === taskList.filePath ? taskList : t
            )
          : [
              ...state.taskLists.filter((i) => i.filePath !== filePath),
              taskList,
            ];
        const newValue: State = {
          ...state,
          taskLists,
        };
        return newValue;
      });
      return taskList.items;
    },
    [toTaskList]
  );

  const syncTodoFileWithCloudStorage = useCallback(
    async (opt: SyncFileOptions) => {
      const result = await syncFileThrottled(opt);
      if (result) {
        await writeFile({
          path: opt.filePath,
          data: result,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return loadTodoFile(opt.filePath, result);
      }
    },
    [loadTodoFile, syncFileThrottled, writeFile]
  );

  const syncAllTodoFileWithCloudStorage = useCallback(
    async (opt: { filePath: string; text: string }[]) => {
      const result = await syncAllFile(opt);
      result.forEach((i) => {
        writeFile({
          path: i.filePath,
          data: i.text,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        }).then(() => loadTodoFile(i.filePath, i.text));
      });
    },
    [loadTodoFile, syncAllFile, writeFile]
  );

  const saveTodoFile = useCallback(
    async (filePath: string, text = "") => {
      await writeFile({
        path: filePath,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      syncTodoFileWithCloudStorage({
        filePath,
        text,
        showSnackbar: true,
      }).catch((e) => void e);
      return loadTodoFile(filePath, text);
    },
    [loadTodoFile, syncTodoFileWithCloudStorage, writeFile]
  );

  const scheduleDueTaskNotification = useCallback(
    async (task: Task) => {
      const today = todayDate();

      if (
        !showNotifications ||
        task.completed ||
        !task.dueDate ||
        isBefore(task.dueDate, today)
      ) {
        return;
      }

      const scheduleAt = subHours(task.dueDate, 12);

      scheduleNotifications({
        notifications: [
          {
            title: t("Reminder"),
            body: task.body.replace(createDueDateRegex(), "").trim(),
            id: hashCode(task.raw),
            schedule: { at: scheduleAt },
          },
        ],
      });
    },
    [showNotifications, scheduleNotifications, t]
  );

  const addTask = useCallback(
    (data: TaskFormData, taskList: TaskListState) => {
      const { items, lineEnding } = taskList;
      const { priority, completionDate, creationDate, dueDate, ...rest } = data;
      const { projects, contexts, tags } = parseTaskBody(rest.body);

      const newTask: Task = {
        ...rest,
        projects,
        contexts,
        tags,
        completed: false,
        raw: "",
        _id: generateId(),
        _order: items.length,
      };

      if (priority) {
        newTask.priority = priority;
      }
      if (completionDate) {
        newTask.completionDate = completionDate;
      }
      if (creationDate) {
        newTask.creationDate = creationDate;
      }
      if (dueDate) {
        newTask.dueDate = dueDate;
      }
      newTask.raw = stringifyTask(newTask);

      scheduleDueTaskNotification(newTask);

      const newTaskList = [...items, newTask];
      const text = stringifyTaskList(newTaskList, lineEnding);
      return saveTodoFile(taskList.filePath, text);
    },
    [saveTodoFile, scheduleDueTaskNotification]
  );

  const editTask = useCallback(
    (data: TaskFormData) => {
      const taskList = findTaskListByTaskId(data._id);
      if (!taskList) {
        return;
      }
      const { items, lineEnding } = taskList;
      const newTaskList = items.map((t) => {
        if (t._id === data._id) {
          cancelNotifications({ notifications: [{ id: hashCode(t.raw) }] });
          const updatedTask: Task = {
            ...t,
            ...data,
          };
          updatedTask.raw = stringifyTask(updatedTask);
          scheduleDueTaskNotification(updatedTask);
          return updatedTask;
        } else {
          return t;
        }
      });
      const text = stringifyTaskList(newTaskList, lineEnding);
      return saveTodoFile(taskList.filePath, text);
    },
    [
      cancelNotifications,
      findTaskListByTaskId,
      saveTodoFile,
      scheduleDueTaskNotification,
    ]
  );

  const deleteTask = useCallback(
    (task: Task) => {
      const taskList = findTaskListByTaskId(task._id);
      if (!taskList) {
        return;
      }
      const { items, lineEnding } = taskList;
      cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] });
      const newTaskList = items.filter((t) => t._id !== task._id);
      const text = stringifyTaskList(newTaskList, lineEnding);
      return saveTodoFile(taskList.filePath, text);
    },
    [cancelNotifications, findTaskListByTaskId, saveTodoFile]
  );

  const completeTask = useCallback(
    async (task: Task) => {
      const taskList = findTaskListByTaskId(task._id);
      if (!taskList) {
        return;
      }

      const updatedTask = { ...task, completed: !task.completed };
      if (createCompletionDate && updatedTask.completed) {
        updatedTask.completionDate = todayDate();
      } else {
        delete updatedTask.completionDate;
      }

      if (updatedTask.completed) {
        cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] });
      }

      const updatedList = taskList.items.map((i) =>
        i._id === task._id ? updatedTask : i
      );

      const text = stringifyTaskList(updatedList, taskList.lineEnding);
      await saveTodoFile(taskList.filePath, text);
    },
    [
      cancelNotifications,
      createCompletionDate,
      findTaskListByTaskId,
      saveTodoFile,
    ]
  );

  const deleteTodoFile = useCallback(
    async (filePath: string) => {
      await deleteFile({
        path: filePath,
        directory: Directory.Documents,
      }).catch(() => console.debug("File does not exist"));
    },
    [deleteFile]
  );

  const closeTodoFile = useCallback(
    async (filePath: string) => {
      const taskList = taskLists.find((list) => list.filePath === filePath);
      if (!taskList) {
        return;
      }

      if (platform === "web" || platform === "ios" || platform === "android") {
        // Delete IndexedDB (web) / remove file from the app's document directory (ios, android)
        await deleteTodoFile(taskList.filePath);
      }

      if (cloudStorageEnabled) {
        unlinkFile(filePath).catch((e) => void e);
      }

      taskList.items.forEach((task) =>
        cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] })
      );

      await removeTodoFilePath(taskList.filePath);

      if (filePath === activeTaskListPath) {
        if (taskLists.length === 2) {
          const fallbackList = taskLists.find(
            (list) => list.filePath !== activeTaskListPath
          );
          if (fallbackList) {
            setActiveTaskListPath(fallbackList.filePath);
          } else {
            setActiveTaskListPath("");
          }
        } else {
          setActiveTaskListPath("");
        }
      }

      setState((state) => {
        return {
          ...state,
          taskLists: state.taskLists.filter((l) => l !== taskList),
        };
      });
    },
    [
      activeTaskListPath,
      cancelNotifications,
      cloudStorageEnabled,
      deleteTodoFile,
      platform,
      unlinkFile,
      removeTodoFilePath,
      setActiveTaskListPath,
      taskLists,
    ]
  );

  const downloadTodoFile = useCallback(() => {
    if (activeTaskList) {
      const content = stringifyTaskList(
        activeTaskList.items,
        activeTaskList.lineEnding
      );
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      FileSaver.saveAs(blob, "todo.txt");
    }
  }, [activeTaskList]);

  const shareTodoFile = useCallback(async () => {
    if (activeTaskList) {
      const { uri } = await getUri({
        directory: Directory.Documents,
        path: activeTaskList.filePath,
      });
      await Share.share({ url: uri });
    }
  }, [activeTaskList, getUri]);

  const scheduleDueTaskNotifications = useCallback(
    async (taskList: Task[]) => {
      taskList.forEach(scheduleDueTaskNotification);
    },
    [scheduleDueTaskNotification]
  );

  const orderTaskList = useCallback(
    (filePaths: string[]) => {
      return taskLists.sort(
        (a, b) => filePaths.indexOf(a.filePath) - filePaths.indexOf(b.filePath)
      );
    },
    [taskLists]
  );

  const reorderTaskList = useCallback(
    async (filePaths: string[]) => {
      await setStorageItem("todo-txt-paths", JSON.stringify(filePaths));
      const reorderedList = orderTaskList(filePaths);
      setState((state) => ({ ...state, taskLists: reorderedList }));
    },
    [orderTaskList, setStorageItem]
  );

  const createNewTodoFile = useCallback(
    async (fileName: string, text = "") => {
      const result = await isFile({
        directory: Directory.Documents,
        path: fileName,
      });

      const saveFile = async (fileName: string, text: string) => {
        await addTodoFilePath(fileName);
        const taskList = await saveTodoFile(fileName, text);
        scheduleDueTaskNotifications(taskList).catch((e) => void e);
        return fileName;
      };

      if (result) {
        return new Promise<string | undefined>(async (resolve, reject) => {
          try {
            setConfirmationDialog({
              open: true,
              onClose: () => resolve(undefined),
              content: (
                <Trans
                  i18nKey="todo.txt already exists. Do you want to replace it"
                  values={{ fileName }}
                />
              ),
              buttons: [
                {
                  text: t("Cancel"),
                  handler: () => {
                    resolve(undefined);
                  },
                },
                {
                  text: t("Replace"),
                  handler: async () => {
                    await saveFile(fileName, text);
                    resolve(fileName);
                  },
                },
              ],
            });
          } catch (error) {
            reject();
          }
        });
      } else {
        return saveFile(fileName, text);
      }
    },
    [
      addTodoFilePath,
      isFile,
      saveTodoFile,
      scheduleDueTaskNotifications,
      setConfirmationDialog,
      t,
    ]
  );

  const openTodoFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  useEffect(() => {
    const setInitialState = async () => {
      await migrate1();
      const paths = await getTodoFilePaths();

      const readFileResult = await Promise.all(
        paths.map((path) =>
          readFile({
            path: path,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          })
            .then((file) => ({ file, path }))
            .catch(() => {
              enqueueSnackbar(t("File not found"), {
                variant: "error",
              });
              removeTodoFilePath(path);
            })
        )
      ).then((list) =>
        list
          .filter((i) => !!i)
          .map((i) => {
            const text = i!.file.data;
            const filePath = i!.path;
            return { taskList: toTaskList(filePath, text), filePath, text };
          })
      );

      syncAllTodoFileWithCloudStorage(readFileResult).catch((e) => void e);

      const taskLists = readFileResult.map((i) => i.taskList);

      if (taskLists) {
        setState((state) => ({
          ...state,
          taskLists,
          init: true,
        }));
        if (shouldNotificationsBeRescheduled()) {
          taskLists.forEach((taskList) =>
            scheduleDueTaskNotifications(taskList.items)
          );
        }
      } else {
        setState((state) => ({
          ...state,
          init: true,
        }));
      }
    };
    setInitialState().finally(() => SplashScreen.hide());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...commonTaskListAttributes,
    saveTodoFile,
    downloadTodoFile,
    shareTodoFile,
    closeTodoFile,
    loadTodoFile,
    addTask,
    editTask,
    deleteTask,
    completeTask,
    init,
    taskLists,
    scheduleDueTaskNotifications,
    activeTaskList,
    findTaskListByTaskId,
    reorderTaskList,
    createNewTodoFile,
    fileInputRef,
    openTodoFilePicker,
  };
});

export { TaskProvider, useTask };
