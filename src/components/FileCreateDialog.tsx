import { Directory } from "@capacitor/filesystem";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React, { useCallback, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { defaultTodoFilePath, useTask } from "../data/TaskContext";
import { useFilesystem } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";

const FileCreateDialog = () => {
  const { t } = useTranslation();
  const { isFile, getUniqueFilePath } = useFilesystem();
  const { addTodoFilePath } = useSettings();
  const [fileName, setFileName] = React.useState("");
  const platform = usePlatform();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { setActiveTaskListPath } = useFilter();
  const {
    taskLists,
    saveTodoFile,
    openTodoFileCreateDialog,
    openTaskDialog,
    todoFileCreateDialogOpen,
  } = useTask();

  const createNewFile = useCallback(
    (filePath?: string) => {
      if (filePath) {
        saveTodoFile(filePath).then(() => {
          addTodoFilePath(filePath);
          setActiveTaskListPath(filePath);
          if (taskLists.length === 0) {
            openTaskDialog(true);
          }
        });
      }
    },
    [
      addTodoFilePath,
      openTaskDialog,
      saveTodoFile,
      setActiveTaskListPath,
      taskLists.length,
    ]
  );

  const handleSave = async () => {
    if (!fileName) {
      return;
    }

    const result = await isFile({
      directory: Directory.Documents,
      path: fileName,
    });

    if (result) {
      setConfirmationDialog({
        content: (
          <Trans
            i18nKey="todo.txt already exists. Do you want to replace it?"
            values={{ fileName }}
          />
        ),
        buttons: [
          {
            text: t("Cancel"),
          },
          {
            text: t("Replace"),
            handler: () => {
              openTodoFileCreateDialog(false);
              createNewFile(fileName);
            },
          },
        ],
      });
    } else {
      openTodoFileCreateDialog(false);
      createNewFile(fileName);
    }
  };

  const handleCancel = () => {
    openTodoFileCreateDialog(false);
  };

  useEffect(() => {
    if (platform === "electron" && todoFileCreateDialogOpen) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) => {
        window.electron.saveFile(fileName).then((filePath) => {
          openTodoFileCreateDialog(false);
          createNewFile(filePath);
        });
      });
    }
  }, [
    openTodoFileCreateDialog,
    getUniqueFilePath,
    createNewFile,
    todoFileCreateDialogOpen,
    platform,
  ]);

  useEffect(() => {
    if (platform !== "electron" && todoFileCreateDialogOpen) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) =>
        setFileName(fileName)
      );
    }
  }, [getUniqueFilePath, platform, todoFileCreateDialogOpen]);

  if (platform === "electron") {
    return null;
  }

  return (
    <Dialog
      aria-label="File dialog"
      open={todoFileCreateDialogOpen}
      onClose={handleCancel}
    >
      <DialogTitle>{t("Create todo.txt")}</DialogTitle>
      <DialogContent>
        <TextField
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
          autoFocus
          margin="normal"
          label={t("File Name")}
          fullWidth
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{t("Cancel")}</Button>
        <Button
          aria-label="Create file"
          disabled={!fileName}
          onClick={handleSave}
        >
          {t("Create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileCreateDialog;
