import { Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { differenceInMinutes, format, isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import JSZip, { OutputType } from "jszip";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import { promptForRating } from "../utils/app-rate";
import { useBecomeActive } from "../utils/app-state";
import { createContext } from "../utils/Context";
import { parseDate, todayDate } from "../utils/date";
import {
  getDoneFilePath,
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
import { LoaderData, loadTodoFiles as _loadTodoFiles } from "./loader";
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
    getCloudFileRefs,
    syncAllFiles,
    syncFileThrottled,
    unlinkCloudFile,
    unlinkCloudDoneFile,
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
  const [taskLists, setTaskLists] = useState<TaskList[]>(
    data.todoFiles.files.map((f) => f.taskList)
  );
  const {
    syncDoneFiles,
    saveDoneFile,
    loadDoneFile,
    archiveTask,
    restoreTask: _restoreTask,
    archiveTasks: _archiveTasks,
    restoreArchivedTasks: _restoreArchivedTasks,
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
    async (optOrPath: SyncFileOptions | string) => {
      let opt: SyncFileOptions;
      if (typeof optOrPath === "string") {
        const taskList = taskLists.find((l) => l.filePath === optOrPath);
        if (!taskList) {
          return;
        }
        const text = stringifyTaskList(taskList.items, taskList.lineEnding);
        opt = {
          filePath: optOrPath,
          text,
          isDoneFile: false,
          showSnackbar: true,
        };
      } else {
        opt = optOrPath;
      }
      const result = await syncFileThrottled(opt);
      if (result) {
        await writeFile({
          path: opt.filePath,
          data: result,
          encoding: Encoding.UTF8,
        });
        return loadTodoFile(opt.filePath, result);
      }
    },
    [loadTodoFile, syncFileThrottled, taskLists, writeFile]
  );

  const syncAllTodoFilesWithCloudStorage = useCallback(
    async (items: SyncItem[]) => {
      syncAllFiles(items.map((i) => ({ ...i, isDoneFile: false }))).then(
        (syncResult) =>
          syncResult.forEach((i) => {
            writeFile({
              path: i.filePath,
              data: i.text,
              encoding: Encoding.UTF8,
            }).then(() => loadTodoFile(i.filePath, i.text));
          })
      );
      syncDoneFiles(items);
    },
    [syncDoneFiles, loadTodoFile, syncAllFiles, writeFile]
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
        encoding: Encoding.UTF8,
      });

      syncTodoFileWithCloudStorage({
        filePath,
        text,
        showSnackbar: true,
        isDoneFile: false,
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
      }).catch(() => console.debug(`${filePath} does not exist`));
      const doneFilePath = getDoneFilePath(filePath);
      if (doneFilePath) {
        await deleteFile({
          path: doneFilePath,
        }).catch(() => console.debug(`${doneFilePath} does not exist`));
      }
    },
    [deleteFile]
  );

  const closeTodoFile = useCallback(
    async (filePath: string) => {
      const taskList = taskLists.find((list) => list.filePath === filePath);
      taskList?.items.forEach((task) =>
        cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] })
      );

      await removeTodoFilePath(filePath);

      if (platform === "web" || platform === "ios" || platform === "android") {
        // delete IndexedDB (web) OR remove file from the app's document directory (ios, android)
        await deleteTodoFile(filePath);
      }

      if (cloudStorageEnabled) {
        unlinkCloudFile(filePath).catch((e) => void e);
        unlinkCloudDoneFile(filePath).catch((e) => void e);
      }

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
      taskLists,
      removeTodoFilePath,
      platform,
      cloudStorageEnabled,
      activeTaskListPath,
      cancelNotifications,
      deleteTodoFile,
      unlinkCloudFile,
      unlinkCloudDoneFile,
      setActiveTaskListPath,
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

  const downloadTodoFile = useCallback(
    async (taskList = activeTaskList) => {
      if (taskList) {
        const { items, lineEnding, fileName } = taskList;

        const zip = await generateZipFile(taskList);

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
    },
    [activeTaskList, generateZipFile]
  );

  const shareTodoFile = useCallback(async () => {
    if (activeTaskList) {
      const zip = await generateZipFile(activeTaskList, "base64");

      if (zip) {
        const result = await writeFile({
          data: zip.zipContent as string,
          path: zip.zipFilename,
        });
        const uri = result.uri;
        await Share.share({ url: uri });
        await deleteFile({
          path: zip.zipFilename,
        });
      } else {
        const result = await getUri({
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
    async (filePath: string, text = "") => {
      const exists = await isFile({
        path: filePath,
      });

      const saveFile = async (filePath: string, text: string) => {
        await addTodoFilePath(filePath);
        const taskList = await saveTodoFile(filePath, text);
        scheduleDueTaskNotifications(taskList.items).catch((e) => void e);
        return filePath;
      };

      if (exists) {
        return new Promise<string | undefined>((resolve, reject) => {
          try {
            setConfirmationDialog({
              open: true,
              onClose: () => resolve(undefined),
              content: (
                <Trans
                  i18nKey="todo.txt already exists. Do you want to replace it"
                  values={{ filePath }}
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
                    await saveFile(filePath, text);
                    resolve(filePath);
                  },
                },
              ],
            });
          } catch (error) {
            reject();
          }
        });
      } else {
        return saveFile(filePath, text);
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

  const archiveTasks = useCallback(() => {
    return _archiveTasks({
      taskLists,
      onSaveTodoFile: async (taskList) => {
        await saveTodoFile(taskList);
      },
    });
  }, [_archiveTasks, saveTodoFile, taskLists]);

  const restoreArchivedTasks = useCallback(() => {
    return _restoreArchivedTasks({
      taskLists,
      onSaveTodoFile: async (taskList) => {
        await saveTodoFile(taskList);
      },
    });
  }, [_restoreArchivedTasks, saveTodoFile, taskLists]);

  const handleFileNotFound = useCallback(
    async (filePath: string) => {
      enqueueSnackbar(t("File not found", { filePath }), {
        variant: "error",
      });
      await closeTodoFile(filePath);
    },
    [enqueueSnackbar, closeTodoFile, t]
  );

  const becomeActiveListener = useCallback(async () => {
    // load files from disk
    const { files, errors } = await _loadTodoFiles();
    // apply external file changes by updating the state
    setTaskLists(files.map((f) => f.taskList));
    // notify the user if a file cannot be found
    for (const error of errors) {
      await handleFileNotFound(error.filePath);
    }
    // sync files with cloud storage
    const refs = await getCloudFileRefs();
    const outdated = refs.every((r) => {
      const date = parseDate(r.lastSync);
      return date && differenceInMinutes(new Date(), date) >= 2;
    });
    if (outdated) {
      syncAllTodoFilesWithCloudStorage(files);
    }
  }, [getCloudFileRefs, handleFileNotFound, syncAllTodoFilesWithCloudStorage]);

  useBecomeActive(becomeActiveListener);

  useEffect(() => {
    data.todoFiles.errors.forEach((err) => handleFileNotFound(err.filePath));
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
    archiveTasks,
    restoreArchivedTasks,
    restoreTask,
    saveDoneFile,
    loadDoneFile,
    taskLists,
    scheduleDueTaskNotifications,
    activeTaskList,
    findTaskListByTaskId,
    reorderTaskList,
    createNewTodoFile,
    syncTodoFileWithCloudStorage,
  };
});

export { TaskProvider, useTask };
