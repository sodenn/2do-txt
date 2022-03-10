import { Directory } from "@capacitor/filesystem";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { defaultTodoFilePath, useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { CloudStorage } from "../types/cloud-storage.types";
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
  const { uploadFileAndResolveConflict, connectedCloudStorages } =
    useCloudStorage();
  const { taskLists, saveTodoFile } = useTask();
  const { fileCreateDialogOpen, setFileCreateDialogOpen } =
    useFileCreateDialog();
  const { setTaskDialogOptions } = useTaskDialog();
  const [selectedCloudStorage, setSelectedCloudStorage] = useState<
    CloudStorage | undefined
  >("Dropbox");

  const createNewFile = useCallback(
    (filePath?: string) => {
      if (filePath) {
        saveTodoFile(filePath).then(() => {
          addTodoFilePath(filePath);
          setActiveTaskListPath(filePath);
          if (taskLists.length === 0) {
            setTaskDialogOptions({ open: true });
          }
        });
      }
    },
    [
      addTodoFilePath,
      setTaskDialogOptions,
      saveTodoFile,
      setActiveTaskListPath,
      taskLists.length,
    ]
  );

  const createTodoFileAndSync = async () => {
    setFileCreateDialogOpen(false);
    createNewFile(fileName);
    if (selectedCloudStorage && connectedCloudStorages[selectedCloudStorage]) {
      const result = await uploadFileAndResolveConflict({
        filePath: fileName,
        text: "",
        mode: "create",
        cloudStorage: selectedCloudStorage,
      });
      if (
        result &&
        result.type === "conflict" &&
        result.conflict &&
        result.conflict.option === "cloud"
      ) {
        const text = result.conflict.text;
        await saveTodoFile(fileName, text);
      }
    }
  };

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
        open: true,
        content: (
          <Trans
            i18nKey="todo.txt already exists. Do you want to replace it"
            values={{ fileName }}
          />
        ),
        buttons: [
          {
            text: t("Cancel"),
          },
          {
            text: t("Replace"),
            handler: createTodoFileAndSync,
          },
        ],
      });
    } else {
      createTodoFileAndSync();
    }
  };

  const handleSelectCloudStorage = (cloudStorage: CloudStorage) => {
    setSelectedCloudStorage((currentValue) =>
      currentValue === cloudStorage ? undefined : cloudStorage
    );
  };

  const handleCancel = () => {
    setFileCreateDialogOpen(false);
  };

  useEffect(() => {
    if (platform === "electron" && fileCreateDialogOpen) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) => {
        window.electron.saveFile(fileName).then((filePath) => {
          setFileCreateDialogOpen(false);
          createNewFile(filePath);
        });
      });
    }
  }, [
    getUniqueFilePath,
    createNewFile,
    fileCreateDialogOpen,
    platform,
    setFileCreateDialogOpen,
  ]);

  useEffect(() => {
    if (platform !== "electron" && fileCreateDialogOpen) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) =>
        setFileName(fileName)
      );
    }
  }, [getUniqueFilePath, platform, fileCreateDialogOpen]);

  if (platform === "electron") {
    return null;
  }

  return (
    <Dialog
      aria-label="File dialog"
      open={fileCreateDialogOpen}
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
          inputProps={{
            "aria-label": "File name",
          }}
        />
        {Object.entries(connectedCloudStorages)
          .filter(([_, connected]) => connected)
          .map(([cloudStorage]) => cloudStorage as CloudStorage)
          .map((cloudStorage) => (
            <FormControlLabel
              key={cloudStorage}
              control={
                <Checkbox
                  aria-label="Sync with cloud storage"
                  checked={selectedCloudStorage === cloudStorage}
                  onChange={() => handleSelectCloudStorage(cloudStorage)}
                />
              }
              label={t("Sync with cloud storage", { cloudStorage }) as string}
            />
          ))}
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
