import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { taskLoader, useTaskStore } from "@/stores/task-store";
import { todayDate } from "@/utils/date";
import { deleteFile, writeFile } from "@/utils/filesystem";
import { hashCode } from "@/utils/hashcode";
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
  getTaskListAttributes,
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
  reorderTodoFileIds,
} from "@/utils/todo-files";
import { useArchivedTask } from "@/utils/useArchivedTask";
import { useNotification } from "@/utils/useNotification";
import { format, isBefore } from "date-fns";
import FileSaver from "file-saver";
import JSZip, { OutputType } from "jszip";
import { isEqual, omit } from "lodash";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface SaveTodoFile {
  (id: number, text: string): Promise<TaskList>;
  (taskList: TaskList): Promise<TaskList>;
}

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
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );
  const {
    selectedPriorities,
    setSelectedPriorities,
    selectedProjects,
    setSelectedProjects,
    selectedContexts,
    setSelectedContexts,
    selectedTags,
    setSelectedTags,
    selectedTaskListIds,
    setSelectedTaskListIds,
  } = useFilterStore();
  const taskLists = useTaskStore((state) => state.taskLists);
  const todoFiles = useTaskStore((state) => state.todoFiles);
  const setTaskLists = useTaskStore((state) => state.setTaskLists);
  const addTaskList = useTaskStore((state) => state.addTaskList);
  const removeTaskList = useTaskStore((state) => state.removeTaskList);
  const { scheduleNotifications, cancelNotifications } = useNotification();
  const {
    saveDoneFile,
    loadDoneFile,
    archiveTask,
    restoreTask: _restoreTask,
    archiveTasks: _archiveTasks,
    restoreArchivedTasks: _restoreArchivedTasks,
  } = useArchivedTask();

  const selectedTaskLists = useMemo(
    () =>
      selectedTaskListIds.length
        ? taskLists.filter((list) => selectedTaskListIds.includes(list.id))
        : [...taskLists],
    [selectedTaskListIds, taskLists],
  );

  const toggleTaskList = useCallback(
    (id: number) => {
      const selectedTaskListIds = selectedTaskLists.map((list) => list.id);
      const newSelectedTaskListIds = selectedTaskListIds.includes(id)
        ? selectedTaskListIds.filter((i) => i !== id)
        : [...selectedTaskListIds, id];
      // reset filter if necessary
      const newSelectedTaskLists = newSelectedTaskListIds.length
        ? taskLists.filter((list) => newSelectedTaskListIds.includes(list.id))
        : [...taskLists];
      const attributes = getTaskListAttributes(newSelectedTaskLists);
      const newSelectedPriority = selectedPriorities.filter(
        (selectedPriority) =>
          Object.keys(attributes.priorities).includes(selectedPriority),
      );
      const newSelectedProjects = selectedProjects.filter((selectedProject) =>
        Object.keys(attributes.projects).includes(selectedProject),
      );
      const newSelectedContexts = selectedContexts.filter((selectedContext) =>
        Object.keys(attributes.contexts).includes(selectedContext),
      );
      const newSelectedTags = selectedTags.filter((selectedTag) =>
        Object.keys(attributes.tags).includes(selectedTag),
      );

      setSelectedTaskListIds(newSelectedTaskListIds);
      setSelectedPriorities(newSelectedPriority);
      setSelectedProjects(newSelectedProjects);
      setSelectedContexts(newSelectedContexts);
      setSelectedTags(newSelectedTags);
    },
    [
      selectedContexts,
      selectedPriorities,
      selectedProjects,
      selectedTags,
      selectedTaskLists,
      setSelectedContexts,
      setSelectedPriorities,
      setSelectedProjects,
      setSelectedTags,
      setSelectedTaskListIds,
      taskLists,
    ],
  );

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
    async (id: number, filename: string, text: string) => {
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
    async (listOrId: TaskList | number, text?: string) => {
      let id: number;

      if (typeof listOrId === "number") {
        id = listOrId;
        text = text || "";
      } else {
        id = listOrId.id;
        text = stringifyTaskList(listOrId.items, listOrId.lineEnding);
      }

      const { filename } = await writeFile({ id, content: text });

      if (typeof listOrId === "number") {
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

      scheduleNotifications([
        {
          body: task.body.replace(createDueDateRegex(), "").trim(), // remove due date from notification text
          id: hashCode(task.raw),
          scheduleAt: task.dueDate,
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

  const deleteTaskWithConfirmation = useCallback(
    async (task: Task) => {
      openConfirmationDialog({
        title: t("Delete task"),
        content: t("Are you sure you want to delete this task?"),
        buttons: [
          {
            text: t("Delete"),
            variant: "destructive",
            handler: () => {
              deleteTask(task);
            },
          },
        ],
      });
    },
    [openConfirmationDialog, deleteTask, t],
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

  const deleteTodoFile = useCallback(async (id: number) => {
    await deleteFile(id).catch(() => console.debug(`${id} does not exist`));
    const doneFileId = await getDoneFileId(id);
    if (doneFileId) {
      await deleteFile(doneFileId).catch(() =>
        console.debug(`${doneFileId} does not exist`),
      );
    }
  }, []);

  const closeTodoFile = useCallback(
    async (id: number) => {
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

      if (selectedTaskListIds.includes(id)) {
        const taskListIds = selectedTaskListIds.filter((val) => val !== id);
        setSelectedTaskListIds(taskListIds);
      }

      removeTaskList(taskList);
    },
    [
      taskLists,
      deleteTodoFile,
      selectedTaskListIds,
      removeTaskList,
      cancelNotifications,
      setSelectedTaskListIds,
    ],
  );

  const generateZipFile = useCallback(
    async (taskLists: TaskList[], outputType: OutputType = "blob") => {
      const zip = new JSZip();
      const filenameWithoutEnding =
        taskLists.length > 1
          ? "todo"
          : taskLists[0].filename.split(".").slice(0, -1).join(".");

      for (const taskList of taskLists) {
        const { items, lineEnding, id, filename } = taskList;
        const doneFileId = await getDoneFileId(id);
        const doneFile = doneFileId ? await loadDoneFile(id) : undefined;
        const todoFileContent = stringifyTaskList(items, lineEnding);
        const doneFileContent =
          doneFile && stringifyTaskList(doneFile.items, lineEnding);
        zip.file(filename, todoFileContent);
        if (doneFile && doneFileContent) {
          zip.file(doneFile.filename, doneFileContent);
        }
      }

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
    async (taskLists: TaskList[]) => {
      const singleList = taskLists.length === 1;
      const hasDoneFile = singleList && (await getDoneFileId(taskLists[0].id));
      if (singleList && !hasDoneFile) {
        const { items, lineEnding, filename } = taskLists[0];
        const text = stringifyTaskList(items, lineEnding);
        const blob = new Blob([text], {
          type: "text/plain;charset=utf-8",
        });
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        FileSaver.saveAs(blob, filename, { autoBom: false });
      } else {
        const zip = await generateZipFile(taskLists);
        if (zip) {
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          FileSaver.saveAs(zip.zipContent as Blob, zip.zipFilename, {
            autoBom: false,
          });
        }
      }
    },
    [generateZipFile],
  );

  const shareTodoFile = useCallback(async () => {
    const zip = await generateZipFile(selectedTaskLists, "blob");
    if (!zip) {
      return downloadTodoFile(selectedTaskLists);
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
      await downloadTodoFile(selectedTaskLists);
    }
  }, [selectedTaskLists, downloadTodoFile, generateZipFile]);

  const scheduleDueTaskNotifications = useCallback(
    async (tasks: Task[]) => {
      tasks.forEach(scheduleDueTaskNotification);
    },
    [scheduleDueTaskNotification],
  );

  const reorderTaskList = useCallback(
    async (ids: number[]) => {
      await reorderTodoFileIds(ids);
      const reorderedList = [...taskLists].sort(
        (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id),
      );
      setTaskLists(reorderedList);
    },
    [setTaskLists, taskLists],
  );

  const createNewTodoFile = useCallback(
    async (id: number, text = "") => {
      await addTodoFileId(id);
      const taskList = await saveTodoFile(id, text);
      scheduleDueTaskNotifications(taskList.items).catch(
        (e: unknown) => void e,
      );
      return id;
    },
    [saveTodoFile, scheduleDueTaskNotifications],
  );

  const addTodoFile = useCallback(
    async (id: number, filename: string, text: string) => {
      await addTodoFileId(id);
      const taskList = await parseTaskList(id, filename, text);
      scheduleDueTaskNotifications(taskList.items).catch(
        (e: unknown) => void e,
      );
      return id;
    },
    [parseTaskList, scheduleDueTaskNotifications],
  );

  const restoreTask = useCallback(
    async (listOrId: number | TaskList, task: Task) => {
      const taskList =
        typeof listOrId === "number"
          ? taskLists.find((t) => t.id === listOrId)
          : listOrId;

      if (!taskList) {
        throw new Error("Cannot find task list");
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
    const newTaskLists = await _archiveTasks(selectedTaskLists);
    return Promise.all(
      newTaskLists.map((taskList) => {
        if (taskList) {
          return saveTodoFile(taskList);
        }
      }),
    );
  }, [_archiveTasks, saveTodoFile, selectedTaskLists]);

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
    async (id: number, filename?: string) => {
      toast({
        variant: "danger",
        description: t("File not found", { filename }),
      });
      await closeTodoFile(id);
    },
    [toast, closeTodoFile, t],
  );

  const handleActive = useCallback(async () => {
    const {
      todoFiles: { files, errors },
    } = await taskLoader();
    // apply external file changes by updating the state
    const newTaskList = files.map((f) => f.taskList);
    if (!areTaskListsEqual(taskLists, newTaskList)) {
      setTaskLists(newTaskList);
    }
    for (const error of errors) {
      await handleFileNotFound(error.id).catch((e: unknown) => void e);
    }
  }, [handleFileNotFound, setTaskLists, taskLists]);

  const handleInit = useCallback(async () => {
    for (const error of todoFiles.errors) {
      if (error.permissionRequired) {
        await new Promise<void>((resolve) => {
          const { dismiss } = toast({
            hideCloseButton: true,
            title: t("Open list"),
            description: t(`Would you like to open the list?`, {
              filename: error.filename,
            }),
            duration: 1000 * 10,
            onOpenChange: () => {
              resolve();
            },
            action: (
              <div className="space-x-1">
                <ToastAction
                  altText="Close list"
                  onClick={async () => {
                    closeTodoFile(error.id);
                    dismiss();
                  }}
                >
                  {t("No")}
                </ToastAction>
                <ToastAction
                  altText="Open list"
                  onClick={async () => {
                    const taskList = await loadTodoFileFromDisk(error.id);
                    addTaskList(taskList);
                    await scheduleDueTaskNotifications(taskList.items);
                    dismiss();
                  }}
                >
                  {t("Yes")}
                </ToastAction>
              </div>
            ),
          });
        });
      } else {
        await handleFileNotFound(error.id, error.filename).catch(
          (e: unknown) => void e,
        );
      }
    }
    taskLists.forEach((taskList) =>
      scheduleDueTaskNotifications(taskList.items),
    );
    // x eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    saveTodoFile,
    toggleTaskList,
    downloadTodoFile,
    shareTodoFile,
    closeTodoFile,
    parseTaskList,
    addTask,
    editTask,
    deleteTask,
    deleteTaskWithConfirmation,
    toggleCompleteTask,
    archiveTasks,
    restoreArchivedTasks,
    restoreTask,
    saveDoneFile,
    loadDoneFile,
    taskLists,
    scheduleDueTaskNotifications,
    selectedTaskLists,
    findTaskListByTaskId,
    reorderTaskList,
    createNewTodoFile,
    addTodoFile,
    handleActive,
    handleInit,
  };
}
