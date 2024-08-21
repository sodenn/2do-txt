import { usePrivateFilesystemStore } from "@/stores/private-filesystem-store";
import { db } from "@/utils/db";
import * as filesystem from "@/utils/filesystem";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { useCallback } from "react";

export function useFilesystem() {
  const openPrivateFilesystemDialog = usePrivateFilesystemStore(
    (state) => state.openPrivateFilesystemDialog,
  );

  const openPrivateFilesystemPicker = useCallback(
    async ({
      filename = "todo.txt",
      importFile = false,
    }: {
      filename?: string;
      importFile?: boolean;
    }) => {
      const suggestedFilename = importFile
        ? undefined
        : await db.files.getNextFreeFilename(filename);
      return new Promise<
        Awaited<ReturnType<typeof filesystem.showSaveFilePicker>>
      >((resolve, reject) => {
        openPrivateFilesystemDialog({
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
    [openPrivateFilesystemDialog],
  );

  const showSaveFilePicker = useCallback(
    async (suggestedName?: string) => {
      if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
        return openPrivateFilesystemPicker({ filename: suggestedName });
      }
      return filesystem.showSaveFilePicker(suggestedName);
    },
    [openPrivateFilesystemPicker],
  );

  const showOpenFilePicker = useCallback(async () => {
    if (!SUPPORTS_SHOW_OPEN_FILE_PICKER) {
      return openPrivateFilesystemPicker({ importFile: true });
    }
    return filesystem.showOpenFilePicker();
  }, [openPrivateFilesystemPicker]);

  return {
    showSaveFilePicker,
    showOpenFilePicker,
  };
}
