import { Clipboard } from "@capacitor/clipboard";
import { Directory } from "@capacitor/filesystem";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
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
import { MouseEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileManagementDialog } from "../data/FileManagementContext";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import { useFilesystem } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";

const FileManagementDialog = () => {
  const platform = usePlatform();
  const { open, setFileManagementDialog } = useFileManagementDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { readdir, deleteFile, readFile } = useFilesystem();
  const { t } = useTranslation();
  const { taskLists, loadTodoFile, closeTodoFile } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const [files, setFiles] = useState<string[]>([]);
  const closedFiles = files.filter((f) =>
    taskLists.every((t) => t.filePath !== f)
  );

  const listFiles = useCallback(() => {
    readdir({
      path: "",
      directory: Directory.Documents,
    }).then((result) => setFiles(result.files));
  }, [readdir]);

  useEffect(() => {
    if (platform !== "electron") {
      listFiles();
    }
  }, [listFiles, platform]);

  const handleCloseFile = (
    event: MouseEvent<HTMLButtonElement>,
    path: string
  ) => {
    closeTodoFile(path).then(listFiles);
    event.stopPropagation();
  };

  const handleDeleteFile = (
    event: MouseEvent<HTMLButtonElement>,
    path: string
  ) => {
    deleteFile({
      path,
      directory: Directory.Documents,
    })
      .catch((error) => {
        console.debug(error);
      })
      .then(listFiles);
    event.stopPropagation();
  };

  const handleOpenFile = async (
    event: MouseEvent<HTMLButtonElement>,
    path: string
  ) => {
    const result = await readFile({
      path,
      directory: Directory.Documents,
    });
    loadTodoFile(path, result.data).then(() => {
      setActiveTaskListPath(path);
      handleClose();
    });
    event.stopPropagation();
  };

  const handleCopyToClipboard = async (path: string) => {
    const result = await readFile({
      path,
      directory: Directory.Documents,
    });
    await Clipboard.write({
      string: result.data,
    });
    enqueueSnackbar(t("Copied to clipboard"), { variant: "info" });
  };

  const handleClose = () => {
    setFileManagementDialog({ open: false });
  };

  return (
    <Dialog maxWidth="xs" open={open} onClose={handleClose}>
      <DialogTitle>{t("Manage todo.txt")}</DialogTitle>
      {taskLists.length > 0 && (
        <List
          sx={{ pt: 0 }}
          subheader={
            <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
              {t("Open files")}
            </ListSubheader>
          }
        >
          {taskLists.map(({ filePath }, idx) => (
            <ListItem
              key={idx}
              button
              onClick={() => handleCopyToClipboard(filePath)}
              secondaryAction={
                <Tooltip title={t("Close") as string}>
                  <IconButton
                    edge="end"
                    aria-label="Close file"
                    onClick={(event) => handleCloseFile(event, filePath)}
                  >
                    <CloseOutlinedIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <Typography
                sx={{ my: 0.5, direction: "rtl", textAlign: "left" }}
                variant="inherit"
                noWrap
              >
                {filePath}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
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
              <Typography variant="inherit" noWrap>
                {file}
              </Typography>
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
