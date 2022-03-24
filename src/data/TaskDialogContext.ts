import { useState } from "react";
import { createContext } from "../utils/Context";
import { Task } from "../utils/task";

const [TaskDialogProvider, useTaskDialog] = createContext(() => {
  const [taskDialogOptions, setTaskDialogOptions] = useState<{
    open: boolean;
    task?: Task;
  }>({ open: false });

  return {
    taskDialogOptions,
    setTaskDialogOptions,
  };
});

export { TaskDialogProvider, useTaskDialog };
