import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { deleteFile, getFilename, readdir } from "../../native-api/filesystem";
import useConfirmationDialogStore from "../../stores/confirmation-dialog-store";
import useFileManagementDialogStore from "../../stores/file-management-dialog-store";
import usePlatformStore from "../../stores/platform-store";
import { useCloudStorage } from "../../utils/CloudStorage";
import { defaultDoneFilePath } from "../../utils/todo-files";
import useTask from "../../utils/useTask";
import ClosedFileList from "./ClosedFileList";
import FileActionButton from "./FileActionButton";
import OpenFileList from "./OpenFileList";

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

const FileManagementDialog = () => {
  const platform = usePlatformStore((state) => state.platform);
  const fileManagementDialogOpen = useFileManagementDialogStore(
    (state) => state.open
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog
  );
  const { unlinkCloudFile } = useCloudStorage();
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog
  );
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
            !filePath.endsWith(`_${defaultDoneFilePath}`)
        );
      setClosedFiles(closedFiles);
      return closedFiles;
    },
    [taskLists]
  );

  const listFiles = useCallback(() => {
    listAllFiles().then(listClosedFiles);
  }, [listAllFiles, listClosedFiles]);

  const openDeleteConfirmationDialog = (filePath: string) => {
    return new Promise<boolean>((resolve) => {
      openConfirmationDialog({
        title: t("Delete"),
        onClose: () => resolve(false),
        content: (
          <Trans
            i18nKey="Delete file"
            values={{ fileName: getFilename(filePath) }}
          />
        ),
        buttons: [
          { text: t("Cancel"), handler: () => resolve(false) },
          {
            text: t("Delete"),
            handler: () => resolve(true),
          },
        ],
      });
    });
  };

  const handleCloseFile = async (options: CloseOptions) => {
    const { filePath, deleteFile } = options;

    const closeFile = () => {
      if (taskLists.length === 1) {
        handleCloseDialog();
      }
      closeTodoFile(filePath).then(listFiles);
    };

    if (deleteFile) {
      const confirmed = await openDeleteConfirmationDialog(filePath);
      if (!confirmed) {
        return;
      }
      closeFile();
    } else {
      closeFile();
    }
    await unlinkCloudFile(filePath);
  };

  const handleDeleteFile = async (filePath: string) => {
    const confirmed = await openDeleteConfirmationDialog(filePath);
    if (!confirmed) {
      return;
    }
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
    <Dialog
      maxWidth="xs"
      fullWidth
      scroll="paper"
      open={fileManagementDialogOpen}
      onClose={handleCloseDialog}
    >
      <DialogTitle>{t("Files")}</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <OpenFileList
          subheader={closedFiles.length > 0}
          onClose={handleCloseFile}
        />
        <ClosedFileList
          list={closedFiles}
          onOpen={handleCloseDialog}
          onDelete={handleDeleteFile}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pt: 1, pb: 2 }}>
        <FileActionButton />
      </DialogActions>
    </Dialog>
  );
};

export default FileManagementDialog;
