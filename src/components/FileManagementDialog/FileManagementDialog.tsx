import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../../data/CloudStorageContext";
import { useConfirmationDialog } from "../../data/ConfirmationDialogContext";
import { useFileManagementDialog } from "../../data/FileManagementDialogContext";
import { useTask } from "../../data/TaskContext";
import { getFilenameFromPath, getFilesystem } from "../../utils/filesystem";
import { getPlatform } from "../../utils/platform";
import CloseFileList from "./CloseFileList";
import FileActionButton from "./FileActionButton";
import OpenFileList from "./OpenFileList";

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

const FileManagementDialog = () => {
  const platform = getPlatform();
  const { fileManagementDialogOpen, setFileManagementDialogOpen } =
    useFileManagementDialog();
  const { unlinkCloudFile, unlinkCloudArchiveFile } = useCloudStorage();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { readdir, deleteFile } = getFilesystem();
  const { t } = useTranslation();
  const { taskLists, closeTodoFile } = useTask();
  const [closedFiles, setClosedFiles] = useState<string[]>([]);

  const listAllFiles = useCallback(async () => {
    if (platform !== "electron") {
      return readdir({
        path: "",
      }).then((result) => {
        return result.files.map((f) => f.name);
      });
    } else {
      return [];
    }
  }, [platform, readdir]);

  const listClosedFiles = useCallback(
    (files: string[]) => {
      const closedFiles = files
        .filter((f) => taskLists.every((t) => t.filePath !== f))
        .filter(
          (filePath) =>
            filePath !== import.meta.env.VITE_ARCHIVE_FILE_NAME &&
            !filePath.endsWith(`_${import.meta.env.VITE_ARCHIVE_FILE_NAME}`)
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
      setConfirmationDialog({
        open: true,
        title: t("Delete"),
        onClose: () => resolve(false),
        content: (
          <Trans
            i18nKey="Delete file"
            values={{ fileName: getFilenameFromPath(filePath) }}
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
      unlinkCloudFile(filePath).catch((e) => void e);
      unlinkCloudArchiveFile(filePath).catch((e) => void e);
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
  };

  const handleDeleteFile = async (filePath: string) => {
    const confirmed = await openDeleteConfirmationDialog(filePath);
    if (!confirmed) {
      return;
    }
    deleteFile({
      path: filePath,
    })
      .catch((error) => {
        console.debug(error);
      })
      .then(listFiles);
    unlinkCloudFile(filePath).catch((e) => void e);
    unlinkCloudArchiveFile(filePath).catch((e) => void e);
  };

  const handleCloseDialog = () => {
    setFileManagementDialogOpen(false);
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
      <DialogTitle>{t("Manage todo.txt")}</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <OpenFileList
          subheader={closedFiles.length > 0}
          onClose={handleCloseFile}
        />
        <CloseFileList
          list={closedFiles}
          onOpen={handleCloseDialog}
          onDelete={handleDeleteFile}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <FileActionButton />
      </DialogActions>
    </Dialog>
  );
};

export default FileManagementDialog;
