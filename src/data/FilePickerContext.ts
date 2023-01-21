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
  const { readFile, selectFile, getUniqueFilePath } = getFilesystem();

  const openDesktopFileDialog = useCallback(
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
        openDesktopFileDialog([path]);
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [openDesktopFileDialog, selectFile]);

  return {
    fileInputRef,
    openFileDialog,
    openDesktopFileDialog,
  };
});

export { FilePickerProvider, useFilePicker };
