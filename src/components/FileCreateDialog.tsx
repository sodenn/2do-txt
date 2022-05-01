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
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { CloudStorage } from "../types/cloud-storage.types";
import { useFilesystem } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";

const defaultTodoFilePath = process.env.REACT_APP_DEFAULT_FILE_NAME;

const FileCreateDialog = () => {
  const { t } = useTranslation();
  const { isFile, getUniqueFilePath } = useFilesystem();
  const { addTodoFilePath } = useSettings();
  const [fileName, setFileName] = useState("");
  const platform = usePlatform();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { setActiveTaskListPath } = useFilter();
  const { uploadFileAndResolveConflict, connectedCloudStorages } =
    useCloudStorage();
  const { saveTodoFile } = useTask();
  const {
    fileCreateDialog: { open, createExampleFile, createFirstTask },
    setFileCreateDialog,
  } = useFileCreateDialog();
  const { setTaskDialogOptions } = useTaskDialog();
  const [selectedCloudStorage, setSelectedCloudStorage] = useState<
    CloudStorage | undefined
  >("Dropbox");

  const createNewFile = useCallback(
    async (filePath: string) => {
      if (!filePath) {
        return;
      }

      let text = "";
      if (createExampleFile) {
        text = await fetch("/todo.txt").then((r) => r.text());
      }

      await saveTodoFile(filePath, text);
      await addTodoFilePath(filePath);
      setActiveTaskListPath(filePath);
      if (createFirstTask) {
        setTaskDialogOptions({ open: true });
      }
    },
    [
      createExampleFile,
      saveTodoFile,
      addTodoFilePath,
      setActiveTaskListPath,
      createFirstTask,
      setTaskDialogOptions,
    ]
  );

  const createTodoFileAndSync = async () => {
    handleClose();
    await createNewFile(fileName);
    if (selectedCloudStorage && connectedCloudStorages[selectedCloudStorage]) {
      const result = await uploadFileAndResolveConflict({
        filePath: fileName,
        text: "",
        mode: "create",
        cloudStorage: selectedCloudStorage,
        archive: false,
      });
      if (
        result &&
        result.type === "conflict" &&
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

    const exists = await isFile({
      directory: Directory.Documents,
      path: fileName,
    });

    if (exists) {
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
      await createTodoFileAndSync();
    }
  };

  const handleSelectCloudStorage = (cloudStorage: CloudStorage) => {
    setSelectedCloudStorage((currentValue) =>
      currentValue === cloudStorage ? undefined : cloudStorage
    );
  };

  const handleClose = useCallback(
    () => setFileCreateDialog((current) => ({ ...current, open: false })),
    [setFileCreateDialog]
  );

  const handleExited = () => setFileCreateDialog({ open: false });

  useEffect(() => {
    if (platform === "electron" && open) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) => {
        window.electron.saveFile(fileName).then((filePath) => {
          handleClose();
          if (filePath) {
            createNewFile(filePath).catch((e) => console.debug(e));
          }
        });
      });
    }
  }, [
    getUniqueFilePath,
    createNewFile,
    open,
    platform,
    setFileCreateDialog,
    handleClose,
  ]);

  useEffect(() => {
    if (platform !== "electron" && open) {
      getUniqueFilePath(defaultTodoFilePath).then(({ fileName }) =>
        setFileName(fileName)
      );
    }
  }, [getUniqueFilePath, platform, open]);

  if (platform === "electron") {
    return null;
  }

  return (
    <Dialog
      aria-label="File dialog"
      open={open}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
    >
      <DialogTitle>
        {createExampleFile ? t("Create example file") : t("Create todo.txt")}
      </DialogTitle>
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
        <Button onClick={handleClose}>{t("Cancel")}</Button>
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
