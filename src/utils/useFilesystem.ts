import { useFallbackFileDialogStore } from "@/stores/fallback-file-dialog-store";
import { fallbackFileSystemDb } from "@/utils/fallback-filesystem";
import * as filesystem from "@/utils/filesystem";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { useCallback } from "react";

export function useFilesystem() {
  const openFallbackFileDialog = useFallbackFileDialogStore(
    (state) => state.openFallbackFileDialog,
  );

  const openFallbackPicker = useCallback(
    async ({
      filename = "todo.txt",
      importFile = false,
    }: {
      filename?: string;
      importFile?: boolean;
    }) => {
      const suggestedFilename =
        await fallbackFileSystemDb.getNextFreeFilename(filename);
      return new Promise<
        Awaited<ReturnType<typeof filesystem.showSaveFilePicker>>
      >((resolve, reject) => {
        openFallbackFileDialog({
          importFile,
          suggestedFilename,
          callback: (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error(`Failed to open file ${suggestedFilename}`));
            }
          },
        });
      });
    },
    [openFallbackFileDialog],
  );

  const showSaveFilePicker = useCallback(
    async (suggestedName?: string) => {
      if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
        return openFallbackPicker({ filename: suggestedName });
      }
      return filesystem.showSaveFilePicker(suggestedName);
    },
    [openFallbackPicker],
  );

  const showOpenFilePicker = useCallback(async () => {
    if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
      return openFallbackPicker({ importFile: true });
    }
    return filesystem.showOpenFilePicker();
  }, [openFallbackPicker]);

  return {
    showSaveFilePicker,
    showOpenFilePicker,
  };
}
