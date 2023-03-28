import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getFilenameFromPath, readFile } from "../native-api/filesystem";
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

interface TaskState {
  taskLists: TaskList[];
  todoFiles: TodoFiles;
  setTaskLists: (taskLists: TaskList[]) => void;
  addTaskList: (taskList: TaskList) => void;
  removeTaskList: (taskList?: TaskList) => void;
  load: () => Promise<void>;
}

async function loadTodoFiles(): Promise<TodoFiles> {
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
      const fileName = getFilenameFromPath(filePath);
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

const taskStore = createStore<TaskState>((set) => ({
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
  load: async () => {
    const todoFiles = await loadTodoFiles();
    const taskLists = todoFiles.files.map((f) => f.taskList);
    set({ todoFiles, taskLists });
  },
}));

const useTasksStore = ((selector: any) =>
  useStore(taskStore, selector)) as UseBoundStore<StoreApi<TaskState>>;

export { taskStore, loadTodoFiles };
export default useTasksStore;
