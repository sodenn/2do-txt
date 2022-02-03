import { Directory } from "@capacitor/filesystem";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { defaultTodoFilePath, useTask } from "../data/TaskContext";
import { useFilesystem } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";

const TodoFileCreateDialog = () => {
  const { t } = useTranslation();
  const { isFile, getUniqueFilePath } = useFilesystem();
  const [fileName, setFileName] = React.useState("");
  const [error, setError] = useState<string | null>(null);
  const platform = usePlatform();
  const { setActiveTaskListPath } = useFilter();
  const {
    taskLists,
    saveTodoFile,
    openTodoFileCreateDialog,
    openTaskDialog,
    todoFileCreateDialogOpen,
  } = useTask();

  const closeDialog = useCallback(
    (filePath?: string) => {
      openTodoFileCreateDialog(false);
      if (filePath) {
        saveTodoFile(filePath).then(() => {
          setActiveTaskListPath(filePath);
          if (taskLists.length === 0) {
            openTaskDialog(true);
          }
        });
      }
    },
    [
      openTaskDialog,
      openTodoFileCreateDialog,
      saveTodoFile,
      setActiveTaskListPath,
      taskLists.length,
    ]
  );

  const handleChange = async (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFileName(value);
    if (!value.endsWith(".txt")) {
      setError(t("The file name must end with .txt"));
    } else {
      const result = await isFile({
        directory: Directory.Documents,
        path: value,
      });
      if (result) {
        setError(t("File already exist"));
      } else {
        setError(null);
      }
    }
  };

  const handleSave = () => {
    if (!error) {
      closeDialog(fileName);
    } else {
      closeDialog();
    }
  };

  const handleCancel = () => {
    closeDialog();
  };

  useEffect(() => {
    if (platform === "electron" && todoFileCreateDialogOpen) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) => {
        window.electron.saveFile(fileName).then((filePath) => {
          closeDialog(filePath);
        });
      });
    }
  }, [getUniqueFilePath, closeDialog, todoFileCreateDialogOpen, platform]);

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
      <DialogTitle>{t("Create new todo.txt file")}</DialogTitle>
      <DialogContent>
        <TextField
          value={fileName}
          autoFocus
          margin="normal"
          error={!!error}
          onChange={handleChange}
          label={t("File Name")}
          fullWidth
          variant="outlined"
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{t("Cancel")}</Button>
        <Button
          aria-label="Create file"
          disabled={!!error}
          onClick={handleSave}
        >
          {t("Create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TodoFileCreateDialog;
