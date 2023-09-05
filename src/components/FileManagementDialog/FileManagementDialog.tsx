import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { deleteFile, readdir } from "@/native-api/filesystem";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useCloudStorage } from "@/utils/CloudStorage";
import { defaultDoneFilePath } from "@/utils/todo-files";
import { useTask } from "@/utils/useTask";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClosedFileList } from "./ClosedFileList";
import { FileActionButton } from "./FileActionButton";
import { OpenFileList } from "./OpenFileList";

export function FileManagementDialog() {
  const platform = usePlatformStore((state) => state.platform);
  const fileManagementDialogOpen = useFileManagementDialogStore(
    (state) => state.open,
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { unlinkCloudFile } = useCloudStorage();
  const { t } = useTranslation();
  const { taskLists, closeTodoFile } = useTask();
  const [closedFiles, setClosedFiles] = useState<string[]>([]);

  const listAllFiles = useCallback(async () => {
    if (platform !== "desktop") {
      return readdir("").then((files) => {
        return files.map((f) => f.name);
      });
    } else {
      return [];
    }
  }, [platform]);

  const listClosedFiles = useCallback(
    (files: string[]) => {
      const closedFiles = files
        .filter((f) => taskLists.every((t) => t.filePath !== f))
        .filter(
          (filePath) =>
            filePath !== defaultDoneFilePath &&
            !filePath.endsWith(`_${defaultDoneFilePath}`),
        );
      setClosedFiles(closedFiles);
      return closedFiles;
    },
    [taskLists],
  );

  const listFiles = useCallback(() => {
    listAllFiles().then(listClosedFiles);
  }, [listAllFiles, listClosedFiles]);

  const handleCloseFile = async (filePath: string) => {
    if (taskLists.length === 1) {
      handleCloseDialog();
    }
    closeTodoFile(filePath).then(listFiles);
    await unlinkCloudFile(filePath);
  };

  const handleDeleteFile = async (filePath: string) => {
    deleteFile(filePath)
      .catch((error) => {
        console.debug(error);
      })
      .then(listFiles);
    await unlinkCloudFile(filePath);
  };

  const handleCloseDialog = () => {
    closeFileManagementDialog();
  };

  useEffect(() => {
    if (fileManagementDialogOpen) {
      listFiles();
    }
  }, [listFiles, fileManagementDialogOpen]);

  return (
    <ResponsiveDialog
      fullWidth
      open={fileManagementDialogOpen}
      onClose={handleCloseDialog}
    >
      <ResponsiveDialogTitle>{t("Files")}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <OpenFileList
          subheader={closedFiles.length > 0}
          onClose={handleCloseFile}
        />
        <ClosedFileList
          list={closedFiles}
          onOpen={handleCloseDialog}
          onDelete={handleDeleteFile}
        />
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <FileActionButton />
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  );
}
