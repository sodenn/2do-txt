import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { taskLoader, useTaskStore } from "@/stores/task-store";
import { todayDate } from "@/utils/date";
import {
  deleteFile,
  deleteFilesNotInList,
  writeFile,
} from "@/utils/filesystem";
import { hashCode } from "@/utils/hashcode";
import { setPreferencesItem } from "@/utils/preferences";
import { canShare, share } from "@/utils/share";
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
import {
  addTodoFileId,
  getDoneFileId,
  loadTodoFileFromDisk,
  removeDoneFileId,
  removeTodoFileId,
} from "@/utils/todo-files";
import { useArchivedTask } from "@/utils/useArchivedTask";
import { useNotification } from "@/utils/useNotification";
import { format, isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import JSZip, { OutputType } from "jszip";
import { isEqual, omit } from "lodash";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

type SaveTodoFile = {
  (id: string, text: string): Promise<TaskList>;
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
  const activeTaskListId = useFilterStore((state) => state.activeTaskListId);
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
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

  const activeTaskList = activeTaskListId
    ? taskLists.find((list) => list.id === activeTaskListId)
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
    async (id: string, filename: string, text: string) => {
      const result = _parseTaskList(text);
      const taskList: TaskList = {
        ...result,
        id,
        filename,
      };
      addTaskList(taskList);
      return taskList;
    },
    [addTaskList],
  );

  const saveTodoFile = useCallback<SaveTodoFile>(
    async (listOrId: TaskList | string, text?: string) => {
      let id: string;

      if (typeof listOrId === "string") {
        id = listOrId;
        text = text || "";
      } else {
        id = listOrId.id;
        text = stringifyTaskList(listOrId.items, listOrId.lineEnding);
      }

      const { filename } = await writeFile({ id, content: text });

      if (typeof listOrId === "string") {
        return parseTaskList(listOrId, filename, text);
      } else {
        // Update the existing task list to not lose the generated task IDs
        const updatedTaskList = updateTaskListAttributes(listOrId);
        addTaskList(updatedTaskList);
        return listOrId;
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

  const deleteTodoFile = useCallback(async (id: string) => {
    await deleteFile(id).catch(() => console.debug(`${id} does not exist`));
    const doneFileId = await getDoneFileId(id);
    if (doneFileId) {
      await deleteFile(doneFileId).catch(() =>
        console.debug(`${doneFileId} does not exist`),
      );
    }
  }, []);

  const closeTodoFile = useCallback(
    async (id: string) => {
      const taskList = taskLists.find((list) => list.id === id);
      taskList?.items.forEach((task) =>
        cancelNotifications([hashCode(task.raw)]),
      );

      const doneFileId = await getDoneFileId(id);
      await removeTodoFileId(id);
      await deleteTodoFile(id);
      if (doneFileId) {
        await Promise.all([
          deleteFile(doneFileId),
          removeDoneFileId(doneFileId),
        ]);
      }

      if (id === activeTaskListId) {
        if (taskLists.length === 2) {
          const fallbackList = taskLists.find(
            (list) => list.id !== activeTaskListId,
          );
          if (fallbackList) {
            setActiveTaskListId(fallbackList.id);
          } else {
            setActiveTaskListId("");
          }
        } else {
          setActiveTaskListId("");
        }
      }

      removeTaskList(taskList);
    },
    [
      taskLists,
      activeTaskListId,
      removeTaskList,
      cancelNotifications,
      deleteTodoFile,
      setActiveTaskListId,
    ],
  );

  const generateZipFile = useCallback(
    async (taskList: TaskList, outputType: OutputType = "blob") => {
      const { items, lineEnding, id, filename } = taskList;
      const hasDoneFile = await getDoneFileId(id);
      const doneFile = hasDoneFile ? await loadDoneFile(id) : undefined;
      if (!doneFile) {
        return;
      }

      const filenameWithoutEnding = filename.split(".").slice(0, -1).join(".");
      const todoFileContent = stringifyTaskList(items, lineEnding);
      const doneFileContent = stringifyTaskList(doneFile.items, lineEnding);
      const zip = new JSZip();
      zip.file(filename, todoFileContent);
      zip.file(doneFile.filename, doneFileContent);
      const blob = await zip.generateAsync({ type: outputType });
      const date = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
      return {
        zipContent: blob,
        zipFilename: `${filenameWithoutEnding}_${date}.zip`,
      };
    },
    [loadDoneFile],
  );

  const downloadTodoFile = useCallback(
    async (taskList = activeTaskList) => {
      if (taskList) {
        const { items, lineEnding, filename } = taskList;
        const zip = await generateZipFile(taskList);
        if (zip) {
          FileSaver.saveAs(zip.zipContent as Blob, zip.zipFilename);
        } else {
          const text = stringifyTaskList(items, lineEnding);
          const blob = new Blob([text], {
            type: "text/plain;charset=utf-8",
          });
          FileSaver.saveAs(blob, filename);
        }
      }
    },
    [activeTaskList, generateZipFile],
  );

  const shareTodoFile = useCallback(async () => {
    if (activeTaskList) {
      const zip = await generateZipFile(activeTaskList, "blob");
      if (!zip) {
        return downloadTodoFile();
      }
      const blob = zip.zipContent as Blob;
      const data = {
        files: [
          new File([blob], zip.zipFilename, {
            type: blob.type,
          }),
        ],
      };
      if (await canShare(data)) {
        await share(data);
      } else {
        await downloadTodoFile();
      }
    }
  }, [activeTaskList, downloadTodoFile, generateZipFile]);

  const scheduleDueTaskNotifications = useCallback(
    async (taskList: Task[]) => {
      taskList.forEach(scheduleDueTaskNotification);
    },
    [scheduleDueTaskNotification],
  );

  const reorderTaskList = useCallback(
    async (ids: string[]) => {
      await setPreferencesItem("todo-files", JSON.stringify(ids));
      const reorderedList = [...taskLists].sort(
        (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id),
      );
      setTaskLists(reorderedList);
    },
    [setTaskLists, taskLists],
  );

  const createNewTodoFile = useCallback(
    async (id: string, text = "") => {
      await addTodoFileId(id);
      const taskList = await saveTodoFile(id, text);
      scheduleDueTaskNotifications(taskList.items).catch((e) => void e);
      return id;
    },
    [saveTodoFile, scheduleDueTaskNotifications],
  );

  const addTodoFile = useCallback(
    async (id: string, filename: string, text: string) => {
      await addTodoFileId(id);
      const taskList = await parseTaskList(id, filename, text);
      scheduleDueTaskNotifications(taskList.items).catch((e) => void e);
      return id;
    },
    [parseTaskList, scheduleDueTaskNotifications],
  );

  const restoreTask = useCallback(
    async (listOrId: string | TaskList, task: Task) => {
      const taskList =
        typeof listOrId === "string"
          ? taskLists.find((t) => t.id === listOrId)
          : listOrId;

      if (!taskList) {
        throw new Error(`Cannot find task list by id "${listOrId}"`);
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
    async (id: string) => {
      toast({
        variant: "danger",
        description: t("File not found"),
      });
      await closeTodoFile(id);
    },
    [toast, closeTodoFile, t],
  );

  const loadTodoFilesFromDisk = useCallback(async () => {
    // load files from disk
    const {
      todoFiles: { files, errors },
    } = await taskLoader();
    // apply external file changes by updating the state
    const newTaskList = await Promise.all(
      files.map((f) => loadTodoFileFromDisk(f.id)),
    );
    if (!areTaskListsEqual(taskLists, newTaskList)) {
      setTaskLists(newTaskList);
    }
    return { files, errors };
  }, [setTaskLists, taskLists]);

  const handleActive = useCallback(async () => {
    const { errors } = await loadTodoFilesFromDisk();
    for (const error of errors) {
      await handleFileNotFound(error.id).catch((e) => void e);
    }
  }, [loadTodoFilesFromDisk, handleFileNotFound]);

  const handleInit = useCallback(async () => {
    for (const error of todoFiles.errors) {
      await handleFileNotFound(error.id).catch((e) => void e);
    }

    const files = todoFiles.files;
    for (const file of files) {
      await new Promise<void>((resolve) => {
        const { dismiss } = toast({
          title: `Load file ${file.filename}`,
          description: "Description",
          duration: 1000 * 10,
          onOpenChange: () => {
            resolve();
          },
          action: (
            <ToastAction
              altText="Load file"
              onClick={async () => {
                const taskList = await loadTodoFileFromDisk(file.id);
                addTaskList(taskList);
                await scheduleDueTaskNotifications(taskList.items);
                dismiss();
              }}
            >
              Load
            </ToastAction>
          ),
        });
      });
    }

    const ids = todoFiles.files.map((f) => f.id);
    deleteFilesNotInList(ids).catch((e) => {
      console.debug("Unable to delete unused files", e);
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
    addTodoFile,
    handleActive,
    handleInit,
  };
}
