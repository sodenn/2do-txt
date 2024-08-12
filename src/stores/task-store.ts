import { getFilename } from "@/utils/filesystem";
import { TaskList } from "@/utils/task-list";
import { getTodoFileIds } from "@/utils/todo-files";
import { createContext, useContext } from "react";
import { createStore, useStore as useZustandStore } from "zustand";

interface TodoFileSuccess {
  type: "success";
  id: string;
  filename: string;
}

interface TodoFileError {
  type: "error";
  id: string;
}

interface TodoFiles {
  files: Omit<TodoFileSuccess, "type">[];
  errors: Omit<TodoFileError, "type">[];
}

export interface TaskFields {
  todoFiles: TodoFiles;
}

interface TaskState extends TaskFields {
  taskLists: TaskList[];
  setTaskLists: (taskLists: TaskList[]) => void;
  addTaskList: (taskList: TaskList) => void;
  removeTaskList: (taskList?: TaskList) => void;
}

export type TaskStore = ReturnType<typeof initializeTaskStore>;

const zustandContext = createContext<TaskStore | null>(null);

export const TaskStoreProvider = zustandContext.Provider;

export async function taskLoader(): Promise<TaskFields> {
  const ids = await getTodoFileIds();
  const result = await Promise.all(
    ids.map(({ todoFileId }) =>
      getFilename(todoFileId)
        .then(
          (filename) =>
            ({ filename, id: todoFileId, type: "success" }) as TodoFileSuccess,
        )
        .catch(() => ({ type: "error", id: todoFileId }) as TodoFileError),
    ),
  );
  const files = result.filter((i) => i.type === "success");
  const errors = result.filter((i) => i.type === "error");
  const todoFiles: TodoFiles = {
    files,
    errors,
  };
  return {
    todoFiles,
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
