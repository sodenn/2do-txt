import { Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { format, isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import JSZip, { OutputType } from "jszip";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import { promptForRating } from "../utils/app-rate";
import { createContext } from "../utils/Context";
import { todayDate } from "../utils/date";
import {
  getFilenameFromPath,
  getFileNameWithoutEnding,
  getFilesystem,
} from "../utils/filesystem";
import { hashCode } from "../utils/hashcode";
import { useNotifications } from "../utils/notifications";
import { getPlatform } from "../utils/platform";
import { setPreferencesItem } from "../utils/preferences";
import {
  createDueDateRegex,
  createNextRecurringTask,
  parseTask,
  Task,
  TaskFormData,
  transformPriority,
} from "../utils/task";
import {
  getCommonTaskListAttributes,
  parseTaskList as _parseTaskList,
  stringifyTaskList,
  TaskList,
  updateTaskList,
} from "../utils/task-list";
import { generateId } from "../utils/uuid";
import { useArchivedTask } from "./ArchivedTaskContext";
import { SyncFileOptions, useCloudStorage } from "./CloudStorageContext";
import { useConfirmationDialog } from "./ConfirmationDialogContext";
import { useFilter } from "./FilterContext";
import { LoaderData } from "./loader";
import { useSettings } from "./SettingsContext";

interface SyncItem {
  filePath: string;
  text: string;
}

type SaveTodoFile = {
  (filePath: string, text: string): Promise<TaskList>;
  (taskList: TaskList): Promise<TaskList>;
};

const [TaskProvider, useTask] = createContext(() => {
  const data = useLoaderData() as LoaderData;
  const { getUri, writeFile, deleteFile, isFile } = getFilesystem();
  const { enqueueSnackbar } = useSnackbar();
  const { setConfirmationDialog } = useConfirmationDialog();
  const {
    addTodoFilePath,
    showNotifications,
    createCreationDate,
    createCompletionDate,
    archiveMode,
    priorityTransformation,
    removeTodoFilePath,
  } = useSettings();
  const {
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudFile,
    cloudStorageEnabled,
  } = useCloudStorage();
  const {
    scheduleNotifications,
    cancelNotifications,
    shouldNotificationsBeRescheduled,
  } = useNotifications();
  const { t } = useTranslation();
  const platform = getPlatform();
  const { activeTaskListPath, setActiveTaskListPath } = useFilter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [taskLists, setTaskLists] = useState<TaskList[]>(
    data.todoFiles.files.map((f) => f.taskList)
  );
  const {
    syncAllDoneFilesWithCloudStorage,
    saveDoneFile,
    loadDoneFile,
    archiveTask,
    restoreTask: _restoreTask,
    archiveAllTask: _archiveAllTask,
    restoreAllArchivedTask: _restoreAllArchivedTask,
  } = useArchivedTask();

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

  const parseTaskList = useCallback((filePath: string, text: string) => {
    const parseResult = _parseTaskList(text);
    const fileName = getFilenameFromPath(filePath);
    const taskList: TaskList = {
      ...parseResult,
      filePath,
      fileName,
    };
    return taskList;
  }, []);

  const loadTodoFile = useCallback(
    async (filePath: string, text: string) => {
      const taskList = parseTaskList(filePath, text);
      setTaskLists((value) => {
        return value.some((t) => t.filePath === filePath)
          ? value.map((t) => (t.filePath === filePath ? taskList : t))
          : [...value, taskList];
      });
      return taskList;
    },
    [parseTaskList]
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

  const syncAllTodoFilesWithCloudStorage = useCallback(
    async (items: SyncItem[]) => {
      syncAllFiles(items.map((i) => ({ ...i, archive: false }))).then(
        (syncResult) =>
          syncResult.forEach((i) => {
            writeFile({
              path: i.filePath,
              data: i.text,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            }).then(() => loadTodoFile(i.filePath, i.text));
          })
      );
      syncAllDoneFilesWithCloudStorage(items);
    },
    [syncAllDoneFilesWithCloudStorage, loadTodoFile, syncAllFiles, writeFile]
  );

  const saveTodoFile = useCallback<SaveTodoFile>(
    async (listOrPath: string | TaskList, text?: string) => {
      text =
        typeof listOrPath === "string"
          ? text || ""
          : stringifyTaskList(listOrPath.items, listOrPath.lineEnding);
      const filePath =
        typeof listOrPath === "string" ? listOrPath : listOrPath.filePath;

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
        archive: false,
      }).catch((e) => void e);

      promptForRating().catch((e) => void e);

      if (typeof listOrPath === "string") {
        return loadTodoFile(filePath, text);
      } else {
        const updatedTaskList = updateTaskList(listOrPath);
        setTaskLists((taskLists) => {
          return taskLists.some((t) => t.filePath === filePath)
            ? taskLists.map((t) =>
                t.filePath === filePath ? updatedTaskList : t
              )
            : [...taskLists, updatedTaskList];
        });
        return listOrPath;
      }
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
    (data: TaskFormData, taskList: TaskList) => {
      const { items } = taskList;
      const {
        priority,
        completionDate,
        creationDate,
        dueDate,
        projects,
        contexts,
        tags,
        raw,
        ...rest
      } = parseTask(data.raw);
      const newTask: Task = {
        ...rest,
        projects,
        contexts,
        tags,
        completed: false,
        raw: raw,
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

      scheduleDueTaskNotification(newTask);

      return saveTodoFile({ ...taskList, items: [...items, newTask] });
    },
    [saveTodoFile, scheduleDueTaskNotification]
  );

  const editTask = useCallback(
    ({ raw, _id }: TaskFormData) => {
      const taskList = findTaskListByTaskId(_id);
      if (!taskList) {
        return;
      }
      const items = taskList.items.map((t) => {
        if (t._id === _id) {
          cancelNotifications({ notifications: [{ id: hashCode(t.raw) }] });
          const updatedTask: Task = {
            ...parseTask(raw),
            _id,
            _order: t._order,
          };
          scheduleDueTaskNotification(updatedTask);
          return updatedTask;
        } else {
          return t;
        }
      });
      return saveTodoFile({ ...taskList, items });
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
      cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] });
      const items = taskList.items.filter((t) => t._id !== task._id);
      items.filter((t) => t._order > task._order).forEach((t) => t._order--);
      return saveTodoFile({ ...taskList, items });
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

      if (updatedTask.completed) {
        if (createCompletionDate) {
          updatedTask.completionDate = todayDate();
        }
        const recurringTasks = createNextRecurringTask(
          task,
          createCreationDate
        );
        if (recurringTasks) {
          const index = taskList.items.findIndex((i) => i._id === task._id);
          taskList.items.splice(index, 0, recurringTasks);
        }
        cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] });
      } else {
        delete updatedTask.completionDate;
      }

      transformPriority(updatedTask, priorityTransformation);

      const newItems =
        archiveMode === "automatic"
          ? taskList.items.filter((i) => i._id !== task._id)
          : taskList.items.map((i) => (i._id === task._id ? updatedTask : i));

      const newTaskList: TaskList = { ...taskList, items: newItems };
      await saveTodoFile(newTaskList);

      if (archiveMode === "automatic") {
        await archiveTask({
          taskList: newTaskList,
          task: updatedTask,
        });
      }
    },
    [
      findTaskListByTaskId,
      priorityTransformation,
      archiveMode,
      saveTodoFile,
      createCompletionDate,
      createCreationDate,
      cancelNotifications,
      archiveTask,
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
        unlinkCloudFile(filePath).catch((e) => void e);
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

      setTaskLists((state) => state.filter((l) => l !== taskList));
    },
    [
      activeTaskListPath,
      cancelNotifications,
      cloudStorageEnabled,
      deleteTodoFile,
      platform,
      unlinkCloudFile,
      removeTodoFilePath,
      setActiveTaskListPath,
      taskLists,
    ]
  );

  const generateZipFile = useCallback(
    async (taskList: TaskList, outputType: OutputType = "blob") => {
      const { items, lineEnding, filePath, fileName } = taskList;

      const doneFile = await loadDoneFile(filePath);
      if (!doneFile) {
        return;
      }
      const fileNameWithoutEnding = getFileNameWithoutEnding(fileName);
      const todoFileText = stringifyTaskList(items, lineEnding);

      if (doneFile) {
        const doneFileText = stringifyTaskList(doneFile.items, lineEnding);
        const zip = new JSZip();
        zip.file(fileName, todoFileText);
        zip.file(doneFile.doneFileName, doneFileText);
        const blob = await zip.generateAsync({ type: outputType });
        const date = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
        return {
          zipContent: blob,
          zipFilename: `${fileNameWithoutEnding}_${date}.zip`,
        };
      }
    },
    [loadDoneFile]
  );

  const downloadTodoFile = useCallback(async () => {
    if (activeTaskList) {
      const { items, lineEnding, fileName } = activeTaskList;

      const zip = await generateZipFile(activeTaskList);

      if (zip) {
        FileSaver.saveAs(zip.zipContent as Blob, zip.zipFilename);
      } else {
        const content = stringifyTaskList(items, lineEnding);
        const blob = new Blob([content], {
          type: "text/plain;charset=utf-8",
        });
        FileSaver.saveAs(blob, fileName);
      }
    }
  }, [activeTaskList, generateZipFile]);

  const shareTodoFile = useCallback(async () => {
    if (activeTaskList) {
      const zip = await generateZipFile(activeTaskList, "base64");

      if (zip) {
        const result = await writeFile({
          data: zip.zipContent as string,
          path: zip.zipFilename,
          directory: Directory.Documents,
        });
        const uri = result.uri;
        await Share.share({ url: uri });
        await deleteFile({
          path: zip.zipFilename,
          directory: Directory.Documents,
        });
      } else {
        const result = await getUri({
          directory: Directory.Documents,
          path: activeTaskList.filePath,
        });
        const uri = result.uri;
        await Share.share({ url: uri });
      }
    }
  }, [activeTaskList, deleteFile, generateZipFile, getUri, writeFile]);

  const scheduleDueTaskNotifications = useCallback(
    async (taskList: Task[]) => {
      taskList.forEach(scheduleDueTaskNotification);
    },
    [scheduleDueTaskNotification]
  );

  const reorderTaskList = useCallback(
    async (filePaths: string[]) => {
      await setPreferencesItem("todo-txt-paths", JSON.stringify(filePaths));
      const reorderedList = [...taskLists].sort(
        (a, b) => filePaths.indexOf(a.filePath) - filePaths.indexOf(b.filePath)
      );
      setTaskLists(reorderedList);
    },
    [taskLists]
  );

  const createNewTodoFile = useCallback(
    async (fileName: string, text = "") => {
      const exists = await isFile({
        directory: Directory.Documents,
        path: fileName,
      });

      const saveFile = async (fileName: string, text: string) => {
        await addTodoFilePath(fileName);
        const taskList = await saveTodoFile(fileName, text);
        scheduleDueTaskNotifications(taskList.items).catch((e) => void e);
        return fileName;
      };

      if (exists) {
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

  const restoreTask = useCallback(
    async (filePathOrTaskList: string | TaskList, task: Task) => {
      const taskList =
        typeof filePathOrTaskList === "string"
          ? taskLists.find((t) => t.filePath === filePathOrTaskList)
          : filePathOrTaskList;

      if (!taskList) {
        throw new Error(
          `Cannot find task list by path "${filePathOrTaskList}"`
        );
      }

      const newTaskList = await _restoreTask({
        taskList,
        task,
      });

      if (newTaskList) {
        await saveTodoFile(newTaskList);
      }
    },
    [_restoreTask, saveTodoFile, taskLists]
  );

  const archiveAllTask = useCallback(() => {
    return _archiveAllTask({
      taskLists,
      onSaveTodoFile: async (taskList) => {
        await saveTodoFile(taskList);
      },
    });
  }, [_archiveAllTask, saveTodoFile, taskLists]);

  const restoreAllArchivedTask = useCallback(() => {
    return _restoreAllArchivedTask({
      taskLists,
      onSaveTodoFile: async (taskList) => {
        await saveTodoFile(taskList);
      },
    });
  }, [_restoreAllArchivedTask, saveTodoFile, taskLists]);

  useEffect(() => {
    data.todoFiles.errors.forEach((err) => {
      enqueueSnackbar(t("File not found"), {
        variant: "error",
      });
      removeTodoFilePath(err.filePath);
    });
    syncAllTodoFilesWithCloudStorage(data.todoFiles.files).catch((e) => void e);
    if (shouldNotificationsBeRescheduled()) {
      taskLists.forEach((taskList) =>
        scheduleDueTaskNotifications(taskList.items)
      );
    }
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
    archiveAllTask,
    restoreAllArchivedTask,
    restoreTask,
    saveDoneFile,
    loadDoneFile,
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
