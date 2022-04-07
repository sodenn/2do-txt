import { Directory } from "@capacitor/filesystem";
import { DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../../data/CloudStorageContext";
import { useConfirmationDialog } from "../../data/ConfirmationDialogContext";
import { useFileManagementDialog } from "../../data/FileManagementDialogContext";
import { useTask } from "../../data/TaskContext";
import { getFilenameFromPath, useFilesystem } from "../../utils/filesystem";
import { usePlatform } from "../../utils/platform";
import { ResponsiveDialog } from "../ResponsiveDialog";
import CloseFileList from "./CloseFileList";
import FileActionButton from "./FileActionButton";
import OpenFileList from "./OpenFileList";

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

const FileManagementDialog = () => {
  const platform = usePlatform();
  const { fileManagementDialogOpen, setFileManagementDialogOpen } =
    useFileManagementDialog();
  const { unlinkFile } = useCloudStorage();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { readdir, deleteFile } = useFilesystem();
  const { t } = useTranslation();
  const { taskLists, closeTodoFile } = useTask();
  const [closedFiles, setClosedFiles] = useState<string[]>([]);

  const listAllFiles = useCallback(async () => {
    if (platform !== "electron") {
      return readdir({
        path: "",
        directory: Directory.Documents,
      }).then((result) => {
        return result.files;
      });
    } else {
      return [];
    }
  }, [platform, readdir]);

  const listClosedFiles = useCallback(
    (files: string[]) => {
      const closedFiles = files.filter((f) =>
        taskLists.every((t) => t.filePath !== f)
      );
      setClosedFiles(closedFiles);
      return closedFiles;
    },
    [taskLists]
  );

  const listFiles = useCallback(() => {
    listAllFiles().then(listClosedFiles);
  }, [listAllFiles, listClosedFiles]);

  useEffect(listFiles, [listFiles]);

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
      directory: Directory.Documents,
    })
      .catch((error) => {
        console.debug(error);
      })
      .then(listFiles);
    unlinkFile(filePath).catch((e) => void e);
  };

  const handleCloseDialog = () => {
    setFileManagementDialogOpen(false);
  };

  return (
    <ResponsiveDialog
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
    </ResponsiveDialog>
  );
};

export default FileManagementDialog;
