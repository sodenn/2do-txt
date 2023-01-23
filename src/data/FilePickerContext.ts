import { useCallback, useRef } from "react";
import { createContext } from "../utils/Context";
import { getFilesystem } from "../utils/filesystem";
import { getPlatform } from "../utils/platform";
import { useSettings } from "./SettingsContext";
import { useTask } from "./TaskContext";

const [FilePickerProvider, useFilePicker] = createContext(() => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTodoFilePath } = useSettings();
  const { loadTodoFile, scheduleDueTaskNotifications } = useTask();
  const { readFile, selectFile } = getFilesystem();

  const openDesktopFile = useCallback(
    async (paths?: string[]) => {
      if (!paths || paths.length === 0) {
        return;
      }
      const path = paths[0];
      const content = await readFile({ path });
      const taskList = await loadTodoFile(path, content.data);
      await addTodoFilePath(path);
      scheduleDueTaskNotifications(taskList.items);
    },
    [addTodoFilePath, loadTodoFile, readFile, scheduleDueTaskNotifications]
  );

  const openFileDialog = useCallback(async () => {
    const platform = getPlatform();
    if (platform === "desktop") {
      const path = await selectFile();
      if (path) {
        openDesktopFile([path]);
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [openDesktopFile, selectFile]);

  return {
    fileInputRef,
    openFileDialog,
    openDesktopFile,
  };
});

export { FilePickerProvider, useFilePicker };
