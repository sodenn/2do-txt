import { Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { isBefore, subHours } from "date-fns";
import FileSaver from "file-saver";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { todayDate } from "../utils/date";
import { useFilesystem } from "../utils/filesystem";
import { hashCode } from "../utils/hashcode";
import { useNotifications } from "../utils/notifications";
import { usePlatform } from "../utils/platform";
import { useStorage } from "../utils/storage";
import {
  parseTaskBody,
  stringifyTask,
  Task,
  TaskFormData,
} from "../utils/task";
import {
  parseTaskList,
  stringifyTaskList,
  useFilterTaskList,
  useTaskGroup,
} from "../utils/task-list";
import { Dictionary } from "../utils/types";
import { generateId } from "../utils/uuid";

const defaultPath = "todo.txt";
const defaultLineEnding = "\n";

interface State {
  init: boolean;
  createCreationDate: boolean;
  createCompletionDate: boolean;
  tasksLoaded: boolean;
  taskDialogOpen: boolean;
  taskList: Task[];
  lineEnding: string;
  priorities: Dictionary<number>;
  projects: Dictionary<number>;
  contexts: Dictionary<number>;
  tags: Dictionary<string[]>;
  selectedTask?: Task;
  todoFilePath?: string;
}

const [TaskProvider, useTask] = createContext(() => {
  const { getUri, readFile, writeFile, deleteFile } = useFilesystem();
  const { getStorageItem, setStorageItem, removeStorageItem } = useStorage();
  const { enqueueSnackbar } = useSnackbar();
  const { scheduleNotifications, cancelNotifications } = useNotifications();
  const { t } = useTranslation();
  const platform = usePlatform();
  const [state, setState] = useState<State>({
    init: false,
    createCreationDate: true,
    createCompletionDate: false,
    tasksLoaded: false,
    taskDialogOpen: false,
    taskList: [],
    lineEnding: defaultLineEnding,
    priorities: {},
    projects: {},
    contexts: {},
    tags: {},
  });

  const {
    init,
    priorities,
    projects,
    contexts,
    tags,
    taskList,
    tasksLoaded,
    lineEnding,
    createCreationDate,
    createCompletionDate,
    taskDialogOpen,
    selectedTask,
    todoFilePath,
  } = state;

  const filteredTaskList = useFilterTaskList(taskList);
  const taskGroups = useTaskGroup(taskList);

  const openTaskDialog = (open: boolean, selectedTask?: Task) => {
    setState((state) => {
      const { selectedTask: oldSelectedTask, ...rest } = state;
      const newState: State = { ...rest, taskDialogOpen: open };
      if (selectedTask) {
        newState.selectedTask = selectedTask;
      }
      return newState;
    });
  };

  const toggleCreateCompletionDate = () => {
    setState((state) => {
      const newValue = !createCompletionDate;
      setStorageItem("create-completion-date", newValue.toString());
      return { ...state, createCompletionDate: newValue };
    });
  };

  const toggleCreateCreationDate = () => {
    setState((state) => {
      const newValue = !createCreationDate;
      setStorageItem("create-creation-date", newValue.toString());
      return { ...state, createCreationDate: newValue };
    });
  };

  const addTask = ({
    priority,
    completionDate,
    creationDate,
    dueDate,
    ...rest
  }: TaskFormData) => {
    const { projects, contexts, tags } = parseTaskBody(rest.body);
    const newTask: Task = {
      ...rest,
      projects,
      contexts,
      tags: tags,
      completed: false,
      raw: "",
      _id: generateId(),
      _order: taskList.length,
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

    const newTaskList = [...taskList, newTask];
    const text = stringifyTaskList(newTaskList, lineEnding);
    return saveTodoFile(text);
  };

  const editTask = ({
    priority,
    completionDate,
    creationDate,
    dueDate,
    ...rest
  }: TaskFormData) => {
    const newTaskList = taskList.map((t) => {
      if (t._id === rest._id) {
        cancelNotifications({ notifications: [{ id: hashCode(t.raw) }] });
        const updatedTask: Task = {
          ...t,
          ...rest,
        };
        if (priority) {
          updatedTask.priority = priority;
        }
        if (completionDate) {
          updatedTask.completionDate = completionDate;
        }
        if (creationDate) {
          updatedTask.creationDate = creationDate;
        }
        if (dueDate) {
          updatedTask.dueDate = dueDate;
        }
        scheduleDueTaskNotification(updatedTask);
        return updatedTask;
      } else {
        return t;
      }
    });
    const text = stringifyTaskList(newTaskList, lineEnding);
    return saveTodoFile(text);
  };

  const deleteTask = (task: Task) => {
    cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] });
    const newTaskList = taskList.filter((t) => t._id !== task._id);
    const text = stringifyTaskList(newTaskList, lineEnding);
    return saveTodoFile(text);
  };

  const completeTask = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    if (createCompletionDate && updatedTask.completed) {
      updatedTask.completionDate = todayDate();
    } else {
      delete updatedTask.completionDate;
    }

    if (updatedTask.completed) {
      cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] });
    }

    const updatedList = taskList.map((i) =>
      i._id === task._id ? updatedTask : i
    );

    setState((state) => ({ ...state, taskList: updatedList }));

    const text = stringifyTaskList(updatedList, lineEnding);
    await saveTodoFile(text);
  };

  const closeTodoFile = async () => {
    if (platform === "web") {
      // Delete IndexedDB
      deleteTodoFile();
    }

    state.taskList.forEach((task) =>
      cancelNotifications({ notifications: [{ id: hashCode(task.raw) }] })
    );

    removeStorageItem("todo-txt-path");
    setState((state) => {
      const { todoFilePath, ...rest } = state;
      return {
        ...rest,
        taskList: [],
        priorities: {},
        projects: {},
        contexts: {},
        tags: {},
        lineEnding: defaultLineEnding,
        tasksLoaded: false,
      };
    });
  };

  const loadTodoFile = async (text?: string, path?: string) => {
    const parseResult = parseTaskList(text);

    setStorageItem("line-ending", parseResult.lineEnding);
    if (path) {
      setStorageItem("todo-txt-path", path);
    }

    setState((state) => {
      const { selectedTask, ...rest } = state;
      const newValue = {
        ...rest,
        taskList: parseResult.taskList,
        lineEnding: parseResult.lineEnding,
        priorities: parseResult.priorities,
        projects: parseResult.projects,
        contexts: parseResult.contexts,
        tags: parseResult.tags,
        tasksLoaded: true,
      };
      if (path) {
        newValue.todoFilePath = path;
      }
      return newValue;
    });

    return parseResult.taskList;
  };

  const saveTodoFile = async (text = "") => {
    await writeFile({
      path: state.todoFilePath || defaultPath,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return loadTodoFile(text);
  };

  const downloadTodoFile = () => {
    const content = stringifyTaskList(taskList, lineEnding);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "todo.txt");
  };

  const shareTodoFile = async () => {
    if (state.todoFilePath) {
      const { uri } = await getUri({
        directory: Directory.Documents,
        path: state.todoFilePath,
      });
      await Share.share({ url: uri });
    }
  };

  const selectTodoFile = async () => {
    let path = defaultPath;
    if (platform === "electron") {
      const selectedPath = await window.electron.selectDir(
        "Select todo.txt folder"
      );
      if (selectedPath) {
        path = `${selectedPath}/${defaultPath}`;
      }
    }
    await setStorageItem("todo-txt-path", path);
    setState((state) => ({ ...state, todoFilePath: path }));
  };

  const deleteTodoFile = async () => {
    await deleteFile({
      path: defaultPath,
      directory: Directory.Documents,
    }).catch(() => console.debug("File does not exist"));
  };

  const scheduleDueTaskNotification = async (task: Task) => {
    const showNotifications = await getStorageItem("show-notifications");

    const today = todayDate();

    if (
      showNotifications !== "true" ||
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
          body: task.body,
          id: hashCode(task.raw),
          schedule: { at: scheduleAt },
        },
      ],
    });
  };

  const scheduleDueTaskNotifications = async (taskList: Task[]) => {
    taskList.forEach(scheduleDueTaskNotification);
  };

  useEffect(() => {
    const setInitialState = async () => {
      const path = await getStorageItem("todo-txt-path");

      const [file, createCompletionDateStr] = await Promise.all([
        readFile({
          path: path ?? defaultPath,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        }).catch(() => {
          if (path) {
            enqueueSnackbar(t("File not found"), {
              variant: "error",
            });
            removeStorageItem("todo-txt-path");
          }
        }),
        getStorageItem("create-completion-date"),
      ]);

      if (file) {
        const parseResult = parseTaskList(file.data);
        setStorageItem("line-ending", parseResult.lineEnding);
        setState((state) => ({
          ...state,
          createCompletionDate: createCompletionDateStr === "true",
          init: true,
          taskList: parseResult.taskList,
          lineEnding: parseResult.lineEnding,
          priorities: parseResult.priorities,
          projects: parseResult.projects,
          contexts: parseResult.contexts,
          tags: parseResult.tags,
          tasksLoaded: true,
          todoFilePath: path ?? defaultPath,
        }));
        scheduleDueTaskNotifications(parseResult.taskList);
      } else {
        setState((state) => ({
          ...state,
          init: true,
        }));
      }
    };
    setInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    saveTodoFile,
    downloadTodoFile,
    shareTodoFile,
    closeTodoFile,
    loadTodoFile,
    selectTodoFile,
    addTask,
    editTask,
    deleteTask,
    completeTask,
    init,
    priorities,
    projects,
    contexts,
    tags,
    taskList,
    filteredTaskList,
    taskGroups,
    tasksLoaded,
    createCreationDate,
    createCompletionDate,
    taskDialogOpen,
    selectedTask,
    todoFilePath,
    openTaskDialog,
    toggleCreateCreationDate,
    toggleCreateCompletionDate,
    scheduleDueTaskNotifications,
  };
});

export { TaskProvider, useTask };
