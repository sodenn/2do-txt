import { useToast } from "@/components/ui/use-toast";
import {
  deleteFile,
  fileExists,
  getFilename,
  getFileNameWithoutExt,
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
  createDueDateRegex,
  createNextRecurringTask,
  parseTask,
  stringifyTask,
  Task,
  transformPriority,
} from "@/utils/task";
import {
  parseTaskList as _parseTaskList,
  getCommonTaskListAttributes,
  stringifyTaskList,
  TaskList,
  updateTaskListAttributes,
} from "@/utils/task-list";
import { getDoneFilePath } from "@/utils/todo-files";
import { useArchivedTask } from "@/utils/useArchivedTask";
import { useNotification } from "@/utils/useNotification";
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

interface Order {
  id: any;
  order: number;
}

interface EditTaskOptions {
  id: string;
  text: string;
  order?: number | Order[];
  completed?: boolean;
}

interface ProcessTaskCompletion {
  task: Task;
  completed: boolean;
  taskList: TaskList;
  notificationId: number;
}

function taskListsWithoutId(taskLists: TaskList[]) {
  return taskLists.map((list) => ({
    ...list,
    items: list.items.map((item) => omit(item, "id")),
  }));
}

function areTaskListsEqual(a: TaskList[], b: TaskList[]) {
  return isEqual(taskListsWithoutId(a), taskListsWithoutId(b));
}

export function useTask() {
  const { t } = useTranslation();
  const { toast } = useToast();
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
      return taskLists.find((list) => list.items.some((i) => i.id === taskId));
    },
    [taskLists],
  );

  const parseTaskList = useCallback(
    async (filePath: string, text: string) => {
      const result = _parseTaskList(text);
      const fileName = getFilename(filePath);
      const taskList: TaskList = {
        ...result,
        filePath,
        fileName,
      };
      addTaskList(taskList);
      return taskList;
    },
    [addTaskList],
  );

  const saveTodoFile = useCallback<SaveTodoFile>(
    async (listOrPath: TaskList | string, text?: string) => {
      let filePath: string;
      let fileContent: string;

      if (typeof listOrPath === "string") {
        filePath = listOrPath;
        fileContent = text || "";
      } else {
        filePath = listOrPath.filePath;
        fileContent = stringifyTaskList(
          listOrPath.items,
          listOrPath.lineEnding,
        );
      }

      await writeFile({
        path: filePath,
        data: fileContent,
      });

      if (typeof listOrPath === "string") {
        return parseTaskList(filePath, fileContent);
      } else {
        // Update the existing task list to not lose the generated task IDs
        const updatedTaskList = updateTaskListAttributes(listOrPath);
        addTaskList(updatedTaskList);
        return listOrPath;
      }
    },
    [addTaskList, parseTaskList],
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
          body: task.body.replace(createDueDateRegex(), "").trim(), // remove due date from notification text
          id: hashCode(task.raw),
          scheduleAt: scheduleAt,
        },
      ]);
    },
    [showNotifications, scheduleNotifications],
  );

  const addTask = useCallback(
    async (text: string, taskList: TaskList) => {
      const { items } = taskList;
      const newTask: Task = {
        ...parseTask(text),
        order: items.length,
      };
      scheduleDueTaskNotification(newTask);
      await saveTodoFile({ ...taskList, items: [...items, newTask] });
    },
    [saveTodoFile, scheduleDueTaskNotification],
  );

  const processTaskCompletion = useCallback(
    ({ task, completed, notificationId, taskList }: ProcessTaskCompletion) => {
      let updatedTask = { ...task, completed };

      if (updatedTask.completed) {
        if (createCompletionDate) {
          updatedTask.completionDate = todayDate();
        }
        const nextTask = createNextRecurringTask(task, createCreationDate);
        if (nextTask) {
          scheduleDueTaskNotification(nextTask);
          const index = taskList.items.findIndex((i) => i.id === task.id);
          taskList.items.splice(index, 0, nextTask);
        }
        cancelNotifications([notificationId]);
      } else {
        delete updatedTask.completionDate;
      }

      updatedTask = transformPriority(updatedTask, priorityTransformation);

      taskList.items =
        archiveMode === "automatic"
          ? taskList.items.filter((i) => i.id !== task.id)
          : taskList.items.map((i) => (i.id === task.id ? updatedTask : i));

      if (archiveMode === "automatic") {
        archiveTask({
          taskList,
          task: updatedTask,
        });
      }

      return {
        ...updatedTask,
        raw: stringifyTask(updatedTask),
      };
    },
    [
      archiveMode,
      archiveTask,
      cancelNotifications,
      createCompletionDate,
      createCreationDate,
      priorityTransformation,
      scheduleDueTaskNotification,
    ],
  );

  const editTask = useCallback(
    async ({ text, id, order, completed }: EditTaskOptions) => {
      const taskList = findTaskListByTaskId(id);
      if (!taskList) {
        return;
      }
      const items = taskList.items.map((task) => {
        if (task.id !== id) {
          return task;
        }
        let updatedTask: Task = {
          ...parseTask(text),
          id: id,
        };
        if (typeof completed === "boolean") {
          updatedTask = processTaskCompletion({
            task: updatedTask,
            completed,
            notificationId: hashCode(task.raw),
            taskList,
          });
        }
        scheduleDueTaskNotification(updatedTask);
        return updatedTask;
      });
      if (order) {
        const orderList: Order[] = Array.isArray(order)
          ? order
          : [{ id, order }];
        orderList.forEach((o) => {
          const task = items.find((t) => t.id === o.id);
          if (task) {
            task.order = o.order;
          }
        });
      }
      await saveTodoFile({ ...taskList, items });
    },
    [
      findTaskListByTaskId,
      processTaskCompletion,
      saveTodoFile,
      scheduleDueTaskNotification,
    ],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      const taskList = findTaskListByTaskId(task.id);
      if (!taskList) {
        return;
      }
      cancelNotifications([hashCode(task.raw)]);
      const items = taskList.items.filter((t) => t.id !== task.id);
      items.filter((t) => t.order > task.order).forEach((t) => t.order--);
      await saveTodoFile({ ...taskList, items });
    },
    [cancelNotifications, findTaskListByTaskId, saveTodoFile],
  );

  const toggleCompleteTask = useCallback(
    async (task: Task) => {
      const taskList = findTaskListByTaskId(task.id);
      if (!taskList) {
        return;
      }

      processTaskCompletion({
        task,
        completed: !task.completed,
        taskList,
        notificationId: hashCode(task.raw),
      });

      await saveTodoFile(taskList);
    },
    [findTaskListByTaskId, saveTodoFile, processTaskCompletion],
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
              title: t("File already exists"),
              content: (
                <Trans
                  i18nKey="todo.txt already exists. Do you want to replace it"
                  values={{ filePath }}
                />
              ),
              buttons: [
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
    async (listOrPath: string | TaskList, task: Task) => {
      const taskList =
        typeof listOrPath === "string"
          ? taskLists.find((t) => t.filePath === listOrPath)
          : listOrPath;

      if (!taskList) {
        throw new Error(`Cannot find task list by path "${listOrPath}"`);
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
      toast({
        variant: "danger",
        description: t("File not found", { filePath }),
      });
      await closeTodoFile(filePath);
    },
    [toast, closeTodoFile, t],
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
    parseTaskList,
    addTask,
    editTask,
    deleteTask,
    toggleCompleteTask,
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
