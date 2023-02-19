import { differenceInMinutes, format, isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import JSZip, { OutputType } from "jszip";
import { useSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { shallow } from "zustand/shallow";
import {
  SyncFileOptions,
  useCloudStorage,
} from "../stores/CloudStorageContext";
import useConfirmationDialog from "../stores/confirmation-dialog-store";
import useFilter from "../stores/filter-store";
import usePlatform from "../stores/platform-store";
import useSettings, {
  addTodoFilePath,
  removeTodoFilePath,
} from "../stores/settings-store";
import useTasks, { loadTodoFiles } from "../stores/task-state";
import { promptForRating } from "./app-rate";
import { parseDate, todayDate } from "./date";
import {
  deleteFile,
  getDoneFilePath,
  getFilenameFromPath,
  getFileNameWithoutEnding,
  getUri,
  isFile,
  writeFile,
} from "./filesystem";
import { hashCode } from "./hashcode";
import { useNotification } from "./notification";
import { setPreferencesItem } from "./preferences";
import { share } from "./share";
import {
  createDueDateRegex,
  createNextRecurringTask,
  parseTask,
  Task,
  TaskFormData,
  transformPriority,
} from "./task";
import {
  getCommonTaskListAttributes,
  parseTaskList as _parseTaskList,
  stringifyTaskList,
  TaskList,
  updateTaskListAttributes,
} from "./task-list";
import useArchivedTask from "./useArchivedTask";
import { useBecomeActive } from "./useBecomeActive";
import { generateId } from "./uuid";

interface SyncItem {
  filePath: string;
  text: string;
}

type SaveTodoFile = {
  (filePath: string, text: string): Promise<TaskList>;
  (taskList: TaskList): Promise<TaskList>;
};

function useTask() {
  const { enqueueSnackbar } = useSnackbar();
  const openConfirmationDialog = useConfirmationDialog(
    (state) => state.openConfirmationDialog
  );
  const {
    showNotifications,
    createCreationDate,
    createCompletionDate,
    archiveMode,
    priorityTransformation,
  } = useSettings(
    (state) => ({
      showNotifications: state.showNotifications,
      createCreationDate: state.createCreationDate,
      createCompletionDate: state.createCompletionDate,
      archiveMode: state.archiveMode,
      priorityTransformation: state.priorityTransformation,
    }),
    shallow
  );
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
  } = useNotification();
  const { t } = useTranslation();
  const platform = usePlatform((state) => state.platform);
  const { activeTaskListPath, setActiveTaskListPath } = useFilter();
  const taskLists = useTasks((state) => state.taskLists);
  const todoFiles = useTasks((state) => state.todoFiles);
  const setTaskLists = useTasks((state) => state.setTaskLists);
  const addTaskList = useTasks((state) => state.addTaskList);
  const removeTaskList = useTasks((state) => state.removeTaskList);
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
      addTaskList(taskList);
      return taskList;
    },
    [addTaskList, parseTaskList]
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
        });
        return loadTodoFile(opt.filePath, result);
      }
    },
    [loadTodoFile, syncFileThrottled, taskLists]
  );

  const syncAllTodoFilesWithCloudStorage = useCallback(
    async (items: SyncItem[]) => {
      syncAllFiles(items.map((i) => ({ ...i, isDoneFile: false }))).then(
        (syncResult) =>
          syncResult.forEach((i) => {
            writeFile({
              path: i.filePath,
              data: i.text,
            }).then(() => loadTodoFile(i.filePath, i.text));
          })
      );
      syncDoneFiles(items);
    },
    [syncDoneFiles, loadTodoFile, syncAllFiles]
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
        const updatedTaskList = updateTaskListAttributes(listOrPath);
        addTaskList(updatedTaskList);
        return listOrPath;
      }
    },
    [addTaskList, loadTodoFile, syncTodoFileWithCloudStorage]
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

      scheduleNotifications([
        {
          body: task.body.replace(createDueDateRegex(), "").trim(),
          id: hashCode(task.raw),
          scheduleAt: scheduleAt,
        },
      ]);
    },
    [showNotifications, scheduleNotifications]
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
          cancelNotifications([hashCode(t.raw)]);
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
      cancelNotifications([hashCode(task.raw)]);
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
        cancelNotifications([hashCode(task.raw)]);
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

  const deleteTodoFile = useCallback(async (filePath: string) => {
    await deleteFile(filePath).catch(() =>
      console.debug(`${filePath} does not exist`)
    );
    const doneFilePath = getDoneFilePath(filePath);
    if (doneFilePath) {
      await deleteFile(doneFilePath).catch(() =>
        console.debug(`${doneFilePath} does not exist`)
      );
    }
  }, []);

  const closeTodoFile = useCallback(
    async (filePath: string) => {
      const taskList = taskLists.find((list) => list.filePath === filePath);
      taskList?.items.forEach((task) =>
        cancelNotifications([hashCode(task.raw)])
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

      removeTaskList(taskList);
    },
    [
      taskLists,
      platform,
      cloudStorageEnabled,
      activeTaskListPath,
      removeTaskList,
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
        const uri = await writeFile({
          data: zip.zipContent as string,
          path: zip.zipFilename,
        });
        await share(uri);
        await deleteFile(zip.zipFilename);
      } else {
        const uri = await getUri(activeTaskList.filePath);
        await share(uri);
      }
    }
  }, [activeTaskList, generateZipFile]);

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
    [setTaskLists, taskLists]
  );

  const createNewTodoFile = useCallback(
    async (filePath: string, text = "") => {
      const exists = await isFile(filePath);

      const saveFile = async (filePath: string, text: string) => {
        await addTodoFilePath(filePath);
        const taskList = await saveTodoFile(filePath, text);
        scheduleDueTaskNotifications(taskList.items).catch((e) => void e);
        return filePath;
      };

      if (exists) {
        return new Promise<string | undefined>((resolve, reject) => {
          try {
            openConfirmationDialog({
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
    [saveTodoFile, scheduleDueTaskNotifications, openConfirmationDialog, t]
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

  const loadTodoFilesFromDisk = useCallback(async () => {
    // load files from disk
    const { files, errors } = await loadTodoFiles();
    // apply external file changes by updating the state
    setTaskLists(files.map((f) => f.taskList));
    return { files, errors };
  }, [setTaskLists]);

  const becomeActiveListener = useCallback(async () => {
    const { files, errors } = await loadTodoFilesFromDisk();
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
  }, [
    loadTodoFilesFromDisk,
    getCloudFileRefs,
    handleFileNotFound,
    syncAllTodoFilesWithCloudStorage,
  ]);

  useBecomeActive(becomeActiveListener);

  useEffect(() => {
    todoFiles.errors.forEach((err) => handleFileNotFound(err.filePath));
    syncAllTodoFilesWithCloudStorage(todoFiles.files).catch((e) => void e);
    shouldNotificationsBeRescheduled().then(() => {
      taskLists.forEach((taskList) =>
        scheduleDueTaskNotifications(taskList.items)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...commonTaskListAttributes,
    loadTodoFilesFromDisk,
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
}

export default useTask;
