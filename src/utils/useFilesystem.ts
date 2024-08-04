import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { getNextFreeFilename } from "@/utils/fallback-filesystem";
import * as filesystem from "@/utils/filesystem";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { useCallback } from "react";

export function useFilesystem() {
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );

  const openFallbackPicker = useCallback(
    async (filename = "todo.txt") => {
      const suggestedFilename = await getNextFreeFilename(filename);
      return new Promise<
        Awaited<ReturnType<typeof filesystem.showSaveFilePicker>>
      >((resolve) => {
        openFileCreateDialog({
          suggestedFilename,
          callback: (result) => {
            resolve(result);
          },
        });
      });
    },
    [openFileCreateDialog],
  );

  const showSaveFilePicker = useCallback(
    async (suggestedName?: string) => {
      if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
        return openFallbackPicker(suggestedName);
      }
      return filesystem.showSaveFilePicker(suggestedName);
    },
    [openFallbackPicker],
  );

  const showOpenFilePicker = useCallback(async () => {
    if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
      return openFallbackPicker();
    }
    return filesystem.showOpenFilePicker();
  }, [openFallbackPicker]);

  return {
    showSaveFilePicker,
    showOpenFilePicker,
  };
}
