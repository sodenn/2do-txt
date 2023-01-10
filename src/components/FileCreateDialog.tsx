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
  useMediaQuery,
  useTheme,
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
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";

const defaultTodoFilePath = import.meta.env.VITE_DEFAULT_FILE_NAME!;

const FileCreateDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const { isFile, selectFile, getUniqueFilePath } = getFilesystem();
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
    CloudStorage | "no-sync"
  >("no-sync");
  const [skip, setSkip] = useState<boolean>();
  const title = createExampleFile
    ? t("Create example file")
    : t("Create todo.txt");

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

  const createTodoFileAndSync = useCallback(
    async (fileName: string) => {
      handleClose();
      await createNewFile(fileName);
      if (
        selectedCloudStorage &&
        selectedCloudStorage !== "no-sync" &&
        cloudStoragesConnectionStatus[selectedCloudStorage]
      ) {
        await uploadFile({
          filePath: fileName,
          text: "",
          cloudStorage: selectedCloudStorage,
          isDoneFile: false,
        });
      }
    },
    [
      cloudStoragesConnectionStatus,
      createNewFile,
      handleClose,
      selectedCloudStorage,
      uploadFile,
    ]
  );

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
            values={{ filePath: fileName }}
          />
        ),
        buttons: [
          {
            text: t("Cancel"),
          },
          {
            text: t("Replace"),
            handler: () => createTodoFileAndSync(fileName),
          },
        ],
      });
    } else {
      await createTodoFileAndSync(fileName);
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

  const skipFileCreateDialog = useCallback(
    async (fileName?: string) => {
      if (!open || !fileName) {
        return;
      }
      if (platform === "desktop" || connectedCloudStorages.length > 0) {
        setSkip(false);
        return;
      }
      const exists = await isFile({ path: defaultTodoFilePath });
      if (!exists) {
        await createTodoFileAndSync(fileName);
        handleClose();
        setSkip(true);
      } else {
        setSkip(false);
      }
    },
    [
      connectedCloudStorages.length,
      createTodoFileAndSync,
      handleClose,
      isFile,
      open,
      platform,
    ]
  );

  const openDesktopDialog = useCallback(async () => {
    if (platform !== "desktop" || !open) {
      return;
    }
    const { fileName } = await getUniqueFilePath(defaultTodoFilePath);
    const filePath = await selectFile(fileName);
    handleClose();
    if (filePath) {
      createNewFile(filePath).catch((e) => console.debug(e));
    }
  }, [
    createNewFile,
    getUniqueFilePath,
    handleClose,
    open,
    platform,
    selectFile,
  ]);

  const initFileName = useCallback(async () => {
    if (platform === "desktop" || !open || fileName) {
      return fileName;
    }
    const { fileName: _fileName } = await getUniqueFilePath(
      defaultTodoFilePath
    );
    setFileName(_fileName);
    return _fileName;
  }, [getUniqueFilePath, open, platform, fileName]);

  useEffect(() => {
    Promise.all([initFileName(), openDesktopDialog()]).then(([fileName]) =>
      skipFileCreateDialog(fileName)
    );
  }, [initFileName, openDesktopDialog, skipFileCreateDialog, open]);

  if (platform === "desktop" || typeof skip === "undefined" || skip) {
    return null;
  }

  const dialogContent = (
    <>
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
          <FormLabel id="cloud-sync">{t("Sync with cloud storage")}</FormLabel>
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
    </>
  );

  if (fullScreenDialog) {
    return (
      <FullScreenDialog
        data-testid="file-create-dialog"
        open={open}
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}
      >
        <FullScreenDialogTitle
          onClose={handleClose}
          accept={{
            text: t("Create"),
            disabled: !fileName,
            onClick: handleSave,
            "aria-label": "Create file",
          }}
        >
          {title}
        </FullScreenDialogTitle>
        <FullScreenDialogContent>{dialogContent}</FullScreenDialogContent>
      </FullScreenDialog>
    );
  }

  return (
    <Dialog
      maxWidth="xs"
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{dialogContent}</DialogContent>
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
