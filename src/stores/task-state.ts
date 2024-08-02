import { readFile } from "@/utils/filesystem";
import { parseTaskList, TaskList } from "@/utils/task-list";
import { getTodoFileIds } from "@/utils/todo-files";
import { createContext, useContext } from "react";
import { createStore, useStore as useZustandStore } from "zustand";

interface TodoFileSuccess {
  type: "success";
  id: string;
  content: string;
  filename: string;
}

interface TodoFileError {
  type: "error";
  id: string;
}

type TodoFile = TodoFileSuccess | TodoFileError;

interface TodoFiles {
  files: { taskList: TaskList; content: string }[];
  errors: TodoFileError[];
}

export interface TaskFields {
  taskLists: TaskList[];
  todoFiles: TodoFiles;
}

interface TaskState extends TaskFields {
  setTaskLists: (taskLists: TaskList[]) => void;
  addTaskList: (taskList: TaskList) => void;
  removeTaskList: (taskList?: TaskList) => void;
}

export type TaskStore = ReturnType<typeof initializeTaskStore>;

const zustandContext = createContext<TaskStore | null>(null);

export const TaskStoreProvider = zustandContext.Provider;

export async function taskLoader(): Promise<TaskFields> {
  const ids = await getTodoFileIds();
  const result: TodoFile[] = await Promise.all(
    ids.map(({ todoFileId: id }) =>
      readFile(id)
        .then(
          ({ filename, content }) =>
            ({
              type: "success",
              id,
              content,
              filename,
            }) as TodoFileSuccess,
        )
        .catch(() => ({ type: "error", id }) as TodoFileError),
    ),
  );
  const files = result
    .filter((i): i is TodoFileSuccess => i.type === "success")
    .map(({ id, content, filename }) => {
      const parseResult = parseTaskList(content);
      const taskList: TaskList = {
        ...parseResult,
        id,
        filename,
      };
      return { taskList, content };
    });
  const errors = result.filter((i): i is TodoFileError => i.type === "error");
  const taskLists = files.map((f) => f.taskList);
  return {
    taskLists,
    todoFiles: { files, errors },
  };
}

export function initializeTaskStore(preloadedState: Partial<TaskState> = {}) {
  return createStore<TaskState>((set) => ({
    taskLists: [],
    todoFiles: { files: [], errors: [] },
    ...preloadedState,
    setTaskLists: (taskLists: TaskList[]) => set({ taskLists }),
    addTaskList: (taskList: TaskList) => {
      set((state) => ({
        taskLists: state.taskLists.some((t) => t.id === taskList.id)
          ? state.taskLists.map((t) => (t.id === taskList.id ? taskList : t))
          : [...state.taskLists, taskList],
      }));
    },
    removeTaskList: (taskList?: TaskList) => {
      if (!taskList) {
        return;
      }
      set((state) => ({
        taskLists: state.taskLists.filter((list) => list.id !== taskList.id),
      }));
    },
  }));
}

export function useTaskStore<T>(selector: (state: TaskState) => T) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
