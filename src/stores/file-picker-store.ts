import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { readFile, selectFile } from "../utils/filesystem";
import useTask from "../utils/useTask";
import usePlatform from "./platform-store";
import { addTodoFilePath } from "./settings-store";

interface FilePickerState {
  fileInput: HTMLInputElement | null;
  setFileInput: (fileInput: HTMLInputElement | null) => void;
}

const useFilePickerStore = create<FilePickerState>((set) => ({
  fileInput: null,
  setFileInput: (fileInput: HTMLInputElement | null) => set({ fileInput }),
}));

function useFilePicker() {
  const platform = usePlatform((state) => state.platform);
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
