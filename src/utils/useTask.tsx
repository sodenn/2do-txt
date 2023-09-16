import { useSnackbar } from "@/components/Snackbar";
import { promptForRating } from "@/native-api/app-rate";
import {
  deleteFile,
  fileExists,
  getFileNameWithoutExt,
  getFilename,
  getUri,
  writeFile,
} from "@/native-api/filesystem";
import { setPreferencesItem } from "@/native-api/preferences";
import { share } from "@/native-api/share";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useSettingsStore } from "@/stores/settings-store";
import { taskLoader, useTaskStore } from "@/stores/task-state";
import { todayDate } from "@/utils/date";
import { hashCode } from "@/utils/hashcode";
import { addTodoFilePath, removeTodoFilePath } from "@/utils/settings";
import {
  Task,
  TaskFormData,
  createDueDateRegex,
  createNextRecurringTask,
  parseTask,
  transformPriority,
} from "@/utils/task";
import {
  TaskList,
  parseTaskList as _parseTaskList,
  getCommonTaskListAttributes,
  stringifyTaskList,
  updateTaskListAttributes,
} from "@/utils/task-list";
import { getDoneFilePath } from "@/utils/todo-files";
import { useArchivedTask } from "@/utils/useArchivedTask";
import { useNotification } from "@/utils/useNotification";
import { generateId } from "@/utils/uuid";
import { format, isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import JSZip, { OutputType } from "jszip";
import { isEqual, omit } from "lodash";
import { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

type SaveTodoFile = {
  (filePath: string, text: string): Promise<TaskList>;
  (taskList: TaskList): Promise<TaskList>;
};

function taskListsWithoutId(taskLists: TaskList[]) {
  return taskLists.map((list) => ({
    ...list,
    items: list.items.map((item) => omit(item, "_id")),
  }));
}

function areTaskListsEqual(a: TaskList[], b: TaskList[]) {
  return isEqual(taskListsWithoutId(a), taskListsWithoutId(b));
}

export function useTask() {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const platform = usePlatformStore((state) => state.platform);
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );
  const showNotifications = useSettingsStore(
    (state) => state.showNotifications,
  );
  const createCreationDate = useSettingsStore(
    (state) => state.createCreationDate,
  );
  const createCompletionDate = useSettingsStore(
    (state) => state.createCompletionDate,
  );
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const priorityTransformation = useSettingsStore(
    (state) => state.priorityTransformation,
  );
  const activeTaskListPath = useFilterStore(
    (state) => state.activeTaskListPath,
  );
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  const taskLists = useTaskStore((state) => state.taskLists);
  const todoFiles = useTaskStore((state) => state.todoFiles);
  const setTaskLists = useTaskStore((state) => state.setTaskLists);
  const addTaskList = useTaskStore((state) => state.addTaskList);
  const removeTaskList = useTaskStore((state) => state.removeTaskList);
  const {
    scheduleNotifications,
    cancelNotifications,
    shouldNotificationsBeRescheduled,
  } = useNotification();
  const {
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
    [taskLists],
  );

  const parseTaskList = useCallback((filePath: string, text: string) => {
    const parseResult = _parseTaskList(text);
    const fileName = getFilename(filePath);
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
    [addTaskList, parseTaskList],
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

      promptForRating().catch((e) => void e);

      if (typeof listOrPath === "string") {
        return loadTodoFile(filePath, text);
      } else {
        const updatedTaskList = updateTaskListAttributes(listOrPath);
        addTaskList(updatedTaskList);
        return listOrPath;
      }
    },
    [addTaskList, loadTodoFile],
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
    [showNotifications, scheduleNotifications],
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
    [saveTodoFile, scheduleDueTaskNotification],
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
    ],
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
    [cancelNotifications, findTaskListByTaskId, saveTodoFile],
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
          createCreationDate,
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
    ],
  );

  const deleteTodoFile = useCallback(async (filePath: string) => {
    await deleteFile(filePath).catch(() =>
      console.debug(`${filePath} does not exist`),
    );
    const doneFilePath = getDoneFilePath(filePath);
    if (doneFilePath) {
      await deleteFile(doneFilePath).catch(() =>
        console.debug(`${doneFilePath} does not exist`),
      );
    }
  }, []);

  const closeTodoFile = useCallback(
    async (filePath: string) => {
      const taskList = taskLists.find((list) => list.filePath === filePath);
      taskList?.items.forEach((task) =>
        cancelNotifications([hashCode(task.raw)]),
      );

      await removeTodoFilePath(filePath);

      if (platform === "web" || platform === "ios" || platform === "android") {
        // delete IndexedDB (web) OR remove file from the app's document directory (ios, android)
        await deleteTodoFile(filePath);
      }

      if (filePath === activeTaskListPath) {
        if (taskLists.length === 2) {
          const fallbackList = taskLists.find(
            (list) => list.filePath !== activeTaskListPath,
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
      activeTaskListPath,
      removeTaskList,
      cancelNotifications,
      deleteTodoFile,
      setActiveTaskListPath,
    ],
  );

  const generateZipFile = useCallback(
    async (taskList: TaskList, outputType: OutputType = "blob") => {
      const { items, lineEnding, filePath, fileName } = taskList;

      const doneFile = await loadDoneFile(filePath);
      if (!doneFile) {
        return;
      }
      const fileNameWithoutEnding = getFileNameWithoutExt(fileName);
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
    [loadDoneFile],
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
    [activeTaskList, generateZipFile],
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
    [scheduleDueTaskNotification],
  );

  const reorderTaskList = useCallback(
    async (filePaths: string[]) => {
      await setPreferencesItem("todo-txt-paths", JSON.stringify(filePaths));
      const reorderedList = [...taskLists].sort(
        (a, b) => filePaths.indexOf(a.filePath) - filePaths.indexOf(b.filePath),
      );
      setTaskLists(reorderedList);
    },
    [setTaskLists, taskLists],
  );

  const createNewTodoFile = useCallback(
    async (filePath: string, text = "") => {
      const exists = await fileExists(filePath);

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
    [saveTodoFile, scheduleDueTaskNotifications, openConfirmationDialog, t],
  );

  const restoreTask = useCallback(
    async (filePathOrTaskList: string | TaskList, task: Task) => {
      const taskList =
        typeof filePathOrTaskList === "string"
          ? taskLists.find((t) => t.filePath === filePathOrTaskList)
          : filePathOrTaskList;

      if (!taskList) {
        throw new Error(
          `Cannot find task list by path "${filePathOrTaskList}"`,
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
    [_restoreTask, saveTodoFile, taskLists],
  );

  const archiveTasks = useCallback(async () => {
    const newTaskLists = await _archiveTasks(taskLists);
    return Promise.all(
      newTaskLists.map((taskList) => {
        if (taskList) {
          return saveTodoFile(taskList);
        }
      }),
    );
  }, [_archiveTasks, saveTodoFile, taskLists]);

  const restoreArchivedTasks = useCallback(async () => {
    const newTaskLists = await _restoreArchivedTasks(taskLists);
    return Promise.all(
      newTaskLists.map((taskList) => {
        if (taskList) {
          return saveTodoFile(taskList);
        }
      }),
    );
  }, [_restoreArchivedTasks, saveTodoFile, taskLists]);

  const handleFileNotFound = useCallback(
    async (filePath: string) => {
      openSnackbar({
        color: "danger",
        message: t("File not found", { filePath }),
      });
      await closeTodoFile(filePath);
    },
    [openSnackbar, closeTodoFile, t],
  );

  const loadTodoFilesFromDisk = useCallback(async () => {
    // load files from disk
    const {
      todoFiles: { files, errors },
    } = await taskLoader();
    // apply external file changes by updating the state
    const newTaskList = files.map((f) => f.taskList);
    if (!areTaskListsEqual(taskLists, newTaskList)) {
      setTaskLists(newTaskList);
    }
    return { files, errors };
  }, [setTaskLists, taskLists]);

  const handleActive = useCallback(async () => {
    const { errors } = await loadTodoFilesFromDisk();
    // notify the user if a file cannot be found
    for (const error of errors) {
      await handleFileNotFound(error.filePath);
    }
  }, [loadTodoFilesFromDisk, handleFileNotFound]);

  const handleInit = useCallback(async () => {
    todoFiles.errors.forEach((err) => handleFileNotFound(err.filePath));
    shouldNotificationsBeRescheduled().then(() => {
      taskLists.forEach((taskList) =>
        scheduleDueTaskNotifications(taskList.items),
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
    handleActive,
    handleInit,
  };
}
