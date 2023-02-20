import { useCallback, useMemo } from "react";
import useFilePickerStore from "../stores/file-picker-store";
import usePlatformStore from "../stores/platform-store";
import { readFile, selectFile } from "./filesystem";
import { addTodoFilePath } from "./settings";
import useTask from "./useTask";

function useFilePicker() {
  const platform = usePlatformStore((state) => state.platform);
  const fileInput = useFilePickerStore((state) => state.fileInput);
  const setFileInput = useFilePickerStore((state) => state.setFileInput);
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
    [loadTodoFile, scheduleDueTaskNotifications]
  );

  const openFileDialog = useCallback(async () => {
    if (platform === "desktop") {
      const path = await selectFile();
      if (path) {
        openDesktopFile([path]);
      }
    } else {
      fileInput?.click();
    }
  }, [fileInput, openDesktopFile, platform]);

  return useMemo(
    () => ({
      setFileInput,
      openFileDialog,
      openDesktopFile,
    }),
    [openDesktopFile, openFileDialog, setFileInput]
  );
}

export default useFilePicker;