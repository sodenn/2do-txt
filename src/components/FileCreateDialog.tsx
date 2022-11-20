import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { CloudStorage, useCloudStorage } from "../data/CloudStorageContext";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { getFilesystem } from "../utils/filesystem";
import { getPlatform } from "../utils/platform";

const defaultTodoFilePath = import.meta.env.VITE_DEFAULT_FILE_NAME!;

const FileCreateDialog = () => {
  const { t } = useTranslation();
  const { isFile, getUniqueFilePath } = getFilesystem();
  const { addTodoFilePath } = useSettings();
  const [fileName, setFileName] = useState("");
  const platform = getPlatform();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { setActiveTaskListPath } = useFilter();
  const { uploadFile, cloudStoragesConnectionStatus, connectedCloudStorages } =
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
  const [skip, setSkip] = useState<boolean>();

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

  const handleClose = useCallback(
    () => setFileCreateDialog((current) => ({ ...current, open: false })),
    [setFileCreateDialog]
  );

  const createTodoFileAndSync = useCallback(async () => {
    handleClose();
    await createNewFile(fileName);
    if (
      selectedCloudStorage &&
      cloudStoragesConnectionStatus[selectedCloudStorage]
    ) {
      await uploadFile({
        filePath: fileName,
        text: "",
        cloudStorage: selectedCloudStorage,
        archive: false,
      });
    }
  }, [
    cloudStoragesConnectionStatus,
    createNewFile,
    fileName,
    handleClose,
    selectedCloudStorage,
    uploadFile,
  ]);

  const handleSave = async () => {
    if (!fileName) {
      return;
    }

    const exists = await isFile({
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

  const handleCloudStorageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedCloudStorage(event.target.value as CloudStorage);
  };

  const handleExited = () => {
    setFileCreateDialog({ open: false });
    setFileName("");
    setSkip(undefined);
    setSelectedCloudStorage("Dropbox");
  };

  const skipFileCreateDialog = useCallback(async () => {
    if (!open || platform === "electron" || connectedCloudStorages.length > 0) {
      setSkip(false);
      return;
    }
    const exists = await isFile({ path: defaultTodoFilePath });
    if (!exists) {
      await createTodoFileAndSync();
      handleClose();
      setSkip(true);
    } else {
      setSkip(false);
    }
  }, [
    connectedCloudStorages.length,
    createTodoFileAndSync,
    handleClose,
    isFile,
    open,
    platform,
  ]);

  const openDesktopDialog = useCallback(async () => {
    if (platform !== "electron" || !open) {
      return;
    }
    const { fileName } = await getUniqueFilePath(defaultTodoFilePath);
    const filePath = await window.electron.saveFile(fileName);
    handleClose();
    if (filePath) {
      createNewFile(filePath).catch((e) => console.debug(e));
    }
  }, [createNewFile, getUniqueFilePath, handleClose, open, platform]);

  const initFileName = useCallback(async () => {
    if (platform === "electron" || !open) {
      return;
    }
    const { fileName } = await getUniqueFilePath(defaultTodoFilePath);
    setFileName(fileName);
  }, [getUniqueFilePath, open, platform]);

  useEffect(() => {
    Promise.all([openDesktopDialog(), initFileName()]).then(
      skipFileCreateDialog
    );
  }, [initFileName, openDesktopDialog, skipFileCreateDialog]);

  if (platform === "electron" || typeof skip === "undefined" || skip) {
    return null;
  }

  return (
    <Dialog
      maxWidth="xs"
      fullWidth
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
          autoFocus={["ios", "android"].every((p) => p !== platform)}
          margin="normal"
          label={t("File Name")}
          fullWidth
          variant="outlined"
          inputProps={{
            "aria-label": "File name",
          }}
        />
        {connectedCloudStorages.length > 0 && (
          <FormControl sx={{ mt: 1 }}>
            <FormLabel id="cloud-sync">
              {t("Sync with cloud storage")}
            </FormLabel>
            <RadioGroup
              aria-labelledby="cloud-sync"
              aria-label="Sync with cloud storage"
              value={selectedCloudStorage}
              onChange={handleCloudStorageChange}
            >
              <FormControlLabel
                value="no-sync"
                control={<Radio />}
                label={t("Not sync")}
              />
              {connectedCloudStorages.map((cloudStorage) => (
                <FormControlLabel
                  key={cloudStorage}
                  value={cloudStorage}
                  control={<Radio />}
                  label={cloudStorage}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
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
