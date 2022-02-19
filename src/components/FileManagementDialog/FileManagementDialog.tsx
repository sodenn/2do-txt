import { Clipboard } from "@capacitor/clipboard";
import { Directory, Encoding } from "@capacitor/filesystem";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Dialog,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import React, { MouseEvent, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../../data/ConfirmationDialogContext";
import { useFileManagementDialog } from "../../data/FileManagementContext";
import { useFilter } from "../../data/FilterContext";
import { useSettings } from "../../data/SettingsContext";
import { useTask } from "../../data/TaskContext";
import { getFilenameFromPath, useFilesystem } from "../../utils/filesystem";
import { usePlatform } from "../../utils/platform";
import StartEllipsis from "../StartEllipsis";
import OpenFileList from "./OpenFileList";

interface CloseOptions {
  event: MouseEvent<HTMLButtonElement>;
  filePath: string;
  deleteFile: boolean;
}

const FileManagementDialog = () => {
  const platform = usePlatform();
  const { fileManagementDialogOpen, setFileManagementDialogOpen } =
    useFileManagementDialog();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { readdir, deleteFile, readFile } = useFilesystem();
  const { t } = useTranslation();
  const { taskLists, loadTodoFile, closeTodoFile } = useTask();
  const { addTodoFilePath } = useSettings();
  const { setActiveTaskListPath } = useFilter();
  const [files, setFiles] = useState<string[]>([]);
  const closedFiles = files.filter((f) =>
    taskLists.every((t) => t.filePath !== f)
  );

  const listFiles = useCallback(() => {
    if (platform !== "electron") {
      readdir({
        path: "",
        directory: Directory.Documents,
      }).then((result) => setFiles(result.files));
    }
  }, [platform, readdir]);

  useEffect(listFiles, [listFiles, platform]);

  const openDeleteConfirmationDialog = (
    filePath: string,
    handler: () => void
  ) => {
    setConfirmationDialog({
      title: t("Delete"),
      content: (
        <Trans
          i18nKey="Delete file"
          values={{ fileName: getFilenameFromPath(filePath) }}
        />
      ),
      buttons: [
        { text: t("Cancel") },
        {
          text: t("Delete"),
          handler,
        },
      ],
    });
  };

  const handleCloseFile = (options: CloseOptions) => {
    const { event, filePath, deleteFile } = options;
    event.stopPropagation();
    if (deleteFile) {
      openDeleteConfirmationDialog(filePath, () => {
        if (taskLists.length === 1) {
          handleClose();
        }
        closeTodoFile(filePath).then(listFiles);
      });
    } else {
      if (taskLists.length === 1) {
        handleClose();
      }
      closeTodoFile(filePath).then(listFiles);
    }
  };

  const handleDeleteFile = (
    event: MouseEvent<HTMLButtonElement>,
    filePath: string
  ) => {
    event.stopPropagation();
    openDeleteConfirmationDialog(filePath, () => {
      deleteFile({
        path: filePath,
        directory: Directory.Documents,
      })
        .catch((error) => {
          console.debug(error);
        })
        .then(listFiles);
    });
  };

  const handleOpenFile = async (
    event: MouseEvent<HTMLButtonElement>,
    filePath: string
  ) => {
    event.stopPropagation();
    const result = await readFile({
      path: filePath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    loadTodoFile(filePath, result.data).then(() => {
      setActiveTaskListPath(filePath);
      addTodoFilePath(filePath);
      handleClose();
    });
  };

  const handleCopyToClipboard = async (filePath: string) => {
    const result = await readFile({
      path: filePath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    await Clipboard.write({
      string: result.data,
    });
    enqueueSnackbar(t("Copied to clipboard"), { variant: "info" });
  };

  const handleClose = () => {
    setFileManagementDialogOpen(false);
  };

  return (
    <Dialog maxWidth="xs" open={fileManagementDialogOpen} onClose={handleClose}>
      <DialogTitle sx={{ px: 2 }}>{t("Manage todo.txt")}</DialogTitle>
      <OpenFileList
        subheader={closedFiles.length > 0}
        onClick={handleCopyToClipboard}
        onClose={handleCloseFile}
      />
      {closedFiles.length > 0 && (
        <List
          sx={{ pt: 0 }}
          subheader={
            <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
              {t("Closed files")}
            </ListSubheader>
          }
        >
          {closedFiles.map((file, idx) => (
            <ListItem
              key={idx}
              button
              sx={{ pr: 12 }}
              onClick={() => handleCopyToClipboard(file)}
              secondaryAction={
                <>
                  <Tooltip title={t("Open") as string}>
                    <IconButton
                      aria-label="Open file"
                      onClick={(event) => handleOpenFile(event, file)}
                    >
                      <OpenInNewOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("Delete") as string}>
                    <IconButton
                      edge="end"
                      aria-label="Delete file"
                      onClick={(event) => handleDeleteFile(event, file)}
                    >
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </>
              }
            >
              <StartEllipsis sx={{ my: 0.5 }} variant="inherit">
                {file}
              </StartEllipsis>
            </ListItem>
          ))}
        </List>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ p: 2 }}>
        {t("Click on the list items to copy the file content to the clipboard")}
      </Typography>
    </Dialog>
  );
};

export default FileManagementDialog;
