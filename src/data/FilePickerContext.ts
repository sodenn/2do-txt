import { useCallback, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import { createContext } from "../utils/Context";
import { readFile, selectFile } from "../utils/filesystem";
import { LoaderData } from "./loader";
import { useSettings } from "./SettingsContext";
import { useTask } from "./TaskContext";

const [FilePickerProvider, useFilePicker] = createContext(() => {
  const { platform } = useLoaderData() as LoaderData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTodoFilePath } = useSettings();
  const { loadTodoFile, scheduleDueTaskNotifications } = useTask();

  const openDesktopFile = useCallback(
    async (paths?: string[]) => {
      if (!paths || paths.length === 0) {
        return;
      }
      const path = paths[0];
      const data = await readFile(path);
      const taskList = await loadTodoFile(path, data);
      await addTodoFilePath(path);
      scheduleDueTaskNotifications(taskList.items);
    },
    [addTodoFilePath, loadTodoFile, scheduleDueTaskNotifications]
  );

  const openFileDialog = useCallback(async () => {
    if (platform === "desktop") {
      const path = await selectFile();
      if (path) {
        openDesktopFile([path]);
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [openDesktopFile, platform]);

  return {
    fileInputRef,
    openFileDialog,
    openDesktopFile,
  };
});

export { FilePickerProvider, useFilePicker };
