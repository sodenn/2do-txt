import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
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

interface TaskLoaderData {
  files: { taskList: TaskList; filePath: string; text: string }[];
  errors: TodoFileError[];
}

interface TaskState {
  taskLists: TaskList[];
  todoFiles: TaskLoaderData;
  setTaskLists: (taskLists: TaskList[]) => void;
  addTaskList: (taskList: TaskList) => void;
  removeTaskList: (taskList?: TaskList) => void;
  init: (data: TaskLoaderData) => void;
}

export async function taskLoader(): Promise<TaskLoaderData> {
  const filePaths = await getTodoFilePaths();
  const result: TodoFile[] = await Promise.all(
    filePaths.map((filePath) =>
      readFile(filePath)
        .then(
          (data) => ({ type: "success", filePath, data } as TodoFileSuccess)
        )
        .catch(() => ({ type: "error", filePath } as TodoFileError))
    )
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
  return {
    files,
    errors,
  };
}

export const taskStore = createStore<TaskState>((set) => ({
  taskLists: [],
  todoFiles: { files: [], errors: [] },
  setTaskLists: (taskLists: TaskList[]) => set({ taskLists }),
  addTaskList: (taskList: TaskList) => {
    set((state) => ({
      taskLists: state.taskLists.some((t) => t.filePath === taskList.filePath)
        ? state.taskLists.map((t) =>
            t.filePath === taskList.filePath ? taskList : t
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
        (list) => list.filePath !== taskList.filePath
      ),
    }));
  },
  init: (data: TaskLoaderData) => {
    const taskLists = data.files.map((f) => f.taskList);
    set({ todoFiles: data, taskLists });
  },
}));

const useTasksStore = ((selector: any) =>
  useStore(taskStore, selector)) as UseBoundStore<StoreApi<TaskState>>;

export default useTasksStore;
