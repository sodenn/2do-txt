import { Directory, Encoding } from "@capacitor/filesystem";
import FileSaver from "file-saver";
import { useSnackbar } from "notistack";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { isDate, parseDate, today } from "../utils/date";
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
  sortByDueDate,
  sortByOriginalOrder,
  sortByPriority,
  stringifyTaskList,
} from "../utils/task-list";
import { Dictionary } from "../utils/types";
import { generateId } from "../utils/uuid";
import { useAppContext } from "./AppContext";

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
  fields: Dictionary<string[]>;
  selectedTask?: Task;
  todoFilePath?: string;
}

const [TaskProvider, useTask] = createContext(() => {
  const { readFile, writeFile, deleteFile } = useFilesystem();
  const { getStorageItem, setStorageItem, removeStorageItem } = useStorage();
  const { enqueueSnackbar } = useSnackbar();
  const { schedule, cancel } = useNotifications();
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
    fields: {},
  });

  const {
    init,
    priorities,
    projects,
    contexts,
    fields,
    taskList,
    tasksLoaded,
    lineEnding,
    createCreationDate,
    createCompletionDate,
    taskDialogOpen,
    selectedTask,
    todoFilePath,
  } = state;

  const {
    searchTerm,
    sortBy,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedFields,
    hideCompletedTasks,
  } = useAppContext();

  const filteredTaskList = useMemo(() => {
    const activeFilter =
      searchTerm.length > 1 ||
      selectedPriorities.length > 0 ||
      selectedProjects.length > 0 ||
      selectedContexts.length > 0 ||
      selectedFields.length > 0;

    const filteredList = taskList.filter((task) => {
      const searchMatch =
        searchTerm.length > 1 &&
        task.body.toLowerCase().includes(searchTerm.toLowerCase());

      if (hideCompletedTasks && task.completed) {
        return false;
      }

      const priorityMatch =
        selectedPriorities.length > 0 &&
        selectedPriorities.some(
          (selectedPriority) => task.priority === selectedPriority
        );

      const projectMatch =
        selectedProjects.length > 0 &&
        selectedProjects.some((selectedProject) =>
          task.projects.includes(selectedProject)
        );

      const contextMatch =
        selectedContexts.length > 0 &&
        selectedContexts.some((selectedContext) =>
          task.contexts.includes(selectedContext)
        );

      const fieldsMatch =
        selectedFields.length > 0 &&
        selectedFields.some((selectedField) =>
          Object.keys(task.fields).includes(selectedField)
        );

      return activeFilter
        ? searchMatch ||
            priorityMatch ||
            projectMatch ||
            contextMatch ||
            fieldsMatch
        : true;
    });

    if (sortBy === "priority") {
      return filteredList.sort(sortByPriority);
    } else if (sortBy === "dueDate") {
      return filteredList.sort(sortByDueDate);
    } else {
      return filteredList.sort(sortByOriginalOrder);
    }
  }, [
    taskList,
    sortBy,
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedFields,
    hideCompletedTasks,
  ]);

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
    completionDate,
    creationDate,
    priority,
    ...rest
  }: TaskFormData) => {
    const { projects, contexts, fields } = parseTaskBody(rest.body);
    const newTask: Task = {
      ...rest,
      projects,
      contexts,
      fields,
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
    newTask.raw = stringifyTask(newTask);

    scheduleDueTaskNotification(newTask);

    const newTaskList = [...taskList, newTask];

    const text = stringifyTaskList(newTaskList, lineEnding);
    return saveTodoFile(text);
  };

  const editTask = ({
    completionDate,
    creationDate,
    priority,
    ...rest
  }: TaskFormData) => {
    const newTaskList = taskList.map((t) => {
      if (t._id === rest._id) {
        cancel({ notifications: [{ id: hashCode(t.raw) }] });
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
    cancel({ notifications: [{ id: hashCode(task.raw) }] });
    const newTaskList = taskList.filter((t) => t._id !== task._id);
    const text = stringifyTaskList(newTaskList, lineEnding);
    return saveTodoFile(text);
  };

  const completeTask = async (task: Task) => {
    if (!task.completed) {
      cancel({ notifications: [{ id: hashCode(task.raw) }] });
    }
    const updatedTask = { ...task };
    updatedTask.completed = !updatedTask.completed;
    delete updatedTask.completionDate;
    if (createCompletionDate && updatedTask.completed) {
      updatedTask.completionDate = today();
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
      deleteTodoFile();
    }
    state.taskList.forEach((task) => {
      cancel({ notifications: [{ id: hashCode(task.raw) }] });
    });
    removeStorageItem("todo-txt-path");
    setState((state) => {
      const { todoFilePath, ...rest } = state;
      return {
        ...rest,
        taskList: [],
        priorities: {},
        projects: {},
        contexts: {},
        fields: {},
        lineEnding: defaultLineEnding,
        tasksLoaded: false,
      };
    });
  };

  const loadTodoFile = async (text?: string, path?: string) => {
    const parseResult = parseTaskList(text);
    if (parseResult) {
      setStorageItem("line-ending", parseResult.lineEnding);
      if (path) {
        setStorageItem("todo-txt-path", path);
      }
      setState((state) => {
        const newValue = {
          ...state,
          taskList: parseResult.taskList,
          lineEnding: parseResult.lineEnding,
          priorities: parseResult.priorities,
          projects: parseResult.projects,
          contexts: parseResult.contexts,
          fields: parseResult.fields,
          tasksLoaded: true,
        };
        delete newValue.selectedTask;
        if (path) {
          newValue.todoFilePath = path;
        } else {
          delete newValue.todoFilePath;
        }
        return newValue;
      });
    }
  };

  const saveTodoFile = async (text?: string) => {
    const pathFromStorage = await getStorageItem("todo-txt-path");
    const todoFilePath = pathFromStorage ?? defaultPath;
    await writeFile({
      path: todoFilePath,
      data: text ?? "",
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return loadTodoFile(text);
  };

  const downloadTodoFile = () => {
    const content = stringifyTaskList(taskList, lineEnding);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "todo1.txt");
  };

  const setTodoFilePath = async () => {
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
    if (showNotifications !== "true" || task.completed) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDates = (task.fields["due"] ?? [])
      .map((str) => parseDate(str))
      .filter(isDate)
      .filter((date) => date.getTime() >= today.getTime());

    if (dueDates.length > 0) {
      const at = dueDates[0];
      at.setHours(at.getHours() - 12);
      schedule({
        notifications: [
          {
            title: t("Reminder"),
            body: task.body,
            id: hashCode(task.raw),
            schedule: { at },
          },
        ],
      });
    }
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
          fields: parseResult.fields,
          tasksLoaded: true,
          todoFilePath: todoFilePath ?? undefined,
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
    closeTodoFile,
    loadTodoFile,
    setTodoFilePath,
    addTask,
    editTask,
    deleteTask,
    completeTask,
    init,
    priorities,
    projects,
    contexts,
    fields,
    taskList,
    filteredTaskList,
    tasksLoaded,
    createCreationDate,
    createCompletionDate,
    taskDialogOpen,
    selectedTask,
    todoFilePath,
    openTaskDialog,
    toggleCreateCreationDate,
    toggleCreateCompletionDate,
  };
});

export { TaskProvider, useTask };
