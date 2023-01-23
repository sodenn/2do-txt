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
import { defaultFilePath, getFilesystem } from "../utils/filesystem";
import { getPlatform } from "../utils/platform";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";

interface FileCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateFile: (filePath: string) => Promise<void>;
}

const FileCreateDialog = () => {
  const platform = getPlatform();
  const {
    fileCreateDialog: { createExampleFile, createFirstTask, open },
    setFileCreateDialog,
  } = useFileCreateDialog();
  const { saveTodoFile } = useTask();
  const { addTodoFilePath } = useSettings();
  const { setActiveTaskListPath } = useFilter();
  const { setTaskDialogOptions } = useTaskDialog();

  const handleClose = useCallback(
    () => setFileCreateDialog((current) => ({ ...current, open: false })),
    [setFileCreateDialog]
  );

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

  if (platform === "desktop") {
    return (
      <DesktopFileCreateDialog
        onCreateFile={createNewFile}
        onClose={handleClose}
        open={open}
      />
    );
  }

  return (
    <WebFileCreateDialog
      onCreateFile={createNewFile}
      onClose={handleClose}
      open={open}
    />
  );
};

const DesktopFileCreateDialog = (props: FileCreateDialogProps) => {
  const { onCreateFile, onClose, open } = props;
  const { saveFile, getUniqueFilePath } = getFilesystem();
  const [lock, setLock] = useState(open);

  const openDesktopDialog = useCallback(async () => {
    if (!open || lock) {
      return;
    }
    try {
      setLock(true);
      const { fileName } = await getUniqueFilePath(defaultFilePath);
      const filePath = await saveFile(fileName);
      onClose();
      if (filePath) {
        onCreateFile(filePath).catch((e) => console.debug(e));
      }
    } finally {
      setLock(false);
    }
  }, [open, lock, saveFile, onClose, getUniqueFilePath, onCreateFile]);

  useEffect(() => {
    openDesktopDialog();
  }, [openDesktopDialog]);

  return null;
};

const WebFileCreateDialog = (props: FileCreateDialogProps) => {
  const { onCreateFile, onClose, open } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const { isFile, getUniqueFilePath } = getFilesystem();
  const [fileName, setFileName] = useState("");
  const { setConfirmationDialog } = useConfirmationDialog();
  const { uploadFile, cloudStoragesConnectionStatus, connectedCloudStorages } =
    useCloudStorage();
  const {
    fileCreateDialog: { createExampleFile, createFirstTask },
    setFileCreateDialog,
  } = useFileCreateDialog();
  const [selectedCloudStorage, setSelectedCloudStorage] = useState<
    CloudStorage | "no-sync"
  >("no-sync");
  const [skip, setSkip] = useState<boolean>();
  const title = createExampleFile
    ? t("Create example file")
    : t("Create todo.txt");

  const createTodoFileAndSync = useCallback(
    async (fileName: string) => {
      onClose();
      await onCreateFile(fileName);
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
      onCreateFile,
      onClose,
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

  const init = useCallback(
    async (fileName?: string) => {
      if (!open || fileName) {
        return;
      }

      const { fileName: _fileName } = await getUniqueFilePath(defaultFilePath);
      setFileName(_fileName);

      if (connectedCloudStorages.length > 0) {
        setSkip(false);
        return;
      }

      const exists = await isFile({ path: defaultFilePath });
      if (!exists) {
        await createTodoFileAndSync(_fileName);
        onClose();
        setSkip(true);
      } else {
        setSkip(false);
      }
    },
    [
      open,
      isFile,
      onClose,
      getUniqueFilePath,
      connectedCloudStorages.length,
      createTodoFileAndSync,
    ]
  );

  useEffect(() => {
    init();
  }, [init]);

  if (typeof skip === "undefined" || skip) {
    return null;
  }

  const dialogContent = (
    <>
      <TextField
        value={fileName}
        onChange={(event) => setFileName(event.target.value)}
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
            {t("Sync with cloud storage", { cloudStorage: t("cloud storage") })}
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
    </>
  );

  if (fullScreenDialog) {
    return (
      <FullScreenDialog
        data-testid="file-create-dialog"
        open={open}
        onClose={onClose}
        TransitionProps={{ onExited: handleExited }}
      >
        <FullScreenDialogTitle
          onClose={onClose}
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
      onClose={onClose}
      TransitionProps={{ onExited: handleExited }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{dialogContent}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
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
