import { createContext, useContext } from "react";
import { createStore, useStore as useZustandStore } from "zustand";
import { getFilename, readFile } from "../native-api/filesystem";
import { getTodoFilePaths } from "../utils/settings";
import { TaskList, parseTaskList } from "../utils/task-list";

interface TodoFileSuccess {
  type: "success";
  filePath: string;
  data: string;
}

interface TodoFileError {
  type: "error";
  filePath: string;
}

type TodoFile = TodoFileSuccess | TodoFileError;

interface TodoFiles {
  files: { taskList: TaskList; filePath: string; text: string }[];
  errors: TodoFileError[];
}

export interface TaskStoreData {
  taskLists: TaskList[];
  todoFiles: TodoFiles;
}

interface TaskStoreInterface extends TaskStoreData {
  setTaskLists: (taskLists: TaskList[]) => void;
  addTaskList: (taskList: TaskList) => void;
  removeTaskList: (taskList?: TaskList) => void;
}

const getDefaultInitialState = (): TaskStoreData => ({
  taskLists: [],
  todoFiles: { files: [], errors: [] },
});

export type TaskStoreType = ReturnType<typeof initializeTaskStore>;

const zustandContext = createContext<TaskStoreType | null>(null);

export const TaskStoreProvider = zustandContext.Provider;

export async function taskLoader(): Promise<TaskStoreData> {
  const filePaths = await getTodoFilePaths();
  const result: TodoFile[] = await Promise.all(
    filePaths.map((filePath) =>
      readFile(filePath)
        .then(
          (data) => ({ type: "success", filePath, data }) as TodoFileSuccess,
        )
        .catch(() => ({ type: "error", filePath }) as TodoFileError),
    ),
  );
  const files = result
    .filter((i): i is TodoFileSuccess => i.type === "success")
    .map((i) => {
      const text = i.data;
      const filePath = i.filePath;
      const parseResult = parseTaskList(text);
      const fileName = getFilename(filePath);
      const taskList: TaskList = {
        ...parseResult,
        filePath,
        fileName,
      };
      return { taskList, filePath, text };
    });
  const errors = result.filter((i): i is TodoFileError => i.type === "error");
  const taskLists = files.map((f) => f.taskList);
  return {
    taskLists,
    todoFiles: { files, errors },
  };
}

export function initializeTaskStore(
  preloadedState: Partial<TaskStoreInterface> = {},
) {
  return createStore<TaskStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
    setTaskLists: (taskLists: TaskList[]) => set({ taskLists }),
    addTaskList: (taskList: TaskList) => {
      set((state) => ({
        taskLists: state.taskLists.some((t) => t.filePath === taskList.filePath)
          ? state.taskLists.map((t) =>
              t.filePath === taskList.filePath ? taskList : t,
            )
          : [...state.taskLists, taskList],
      }));
    },
    removeTaskList: (taskList?: TaskList) => {
      if (!taskList) {
        return;
      }
      set((state) => ({
        taskLists: state.taskLists.filter(
          (list) => list.filePath !== taskList.filePath,
        ),
      }));
    },
  }));
}

export default function useTaskStore<T>(
  selector: (state: TaskStoreInterface) => T,
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
