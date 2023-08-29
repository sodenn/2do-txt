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
import {
  fileExists,
  getUniqueFilePath,
  saveFile,
} from "@/native-api/filesystem";
import useConfirmationDialogStore from "@/stores/confirmation-dialog-store";
import useFileCreateDialogStore from "@/stores/file-create-dialog-store";
import useFilterStore from "@/stores/filter-store";
import usePlatformStore from "@/stores/platform-store";
import useTaskDialogStore from "@/stores/task-dialog-store";
import { Provider, useCloudStorage } from "@/utils/CloudStorage";
import { addTodoFilePath } from "@/utils/settings";
import { defaultTodoFilePath } from "@/utils/todo-files";
import useTask from "@/utils/useTask";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogTitle,
} from "@/components/FullScreenDialog";

interface FileCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateFile: (filePath: string) => Promise<void>;
}

const FileCreateDialog = () => {
  const platform = usePlatformStore((state) => state.platform);
  const fileCreateDialogOpen = useFileCreateDialogStore((state) => state.open);
  const createExampleFile = useFileCreateDialogStore(
    (state) => state.createExampleFile,
  );
  const createFirstTask = useFileCreateDialogStore(
    (state) => state.createFirstTask,
  );
  const closeFileCreateDialog = useFileCreateDialogStore(
    (state) => state.closeFileCreateDialog,
  );
  const { saveTodoFile } = useTask();
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);

  const handleClose = useCallback(
    () => closeFileCreateDialog(),
    [closeFileCreateDialog],
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
        openTaskDialog();
      }
    },
    [
      createExampleFile,
      saveTodoFile,
      setActiveTaskListPath,
      createFirstTask,
      openTaskDialog,
    ],
  );

  if (platform === "desktop") {
    return (
      <DesktopFileCreateDialog
        onCreateFile={createNewFile}
        onClose={handleClose}
        open={fileCreateDialogOpen}
      />
    );
  }

  return (
    <WebFileCreateDialog
      onCreateFile={createNewFile}
      onClose={handleClose}
      open={fileCreateDialogOpen}
    />
  );
};

const DesktopFileCreateDialog = (props: FileCreateDialogProps) => {
  const { onCreateFile, onClose, open } = props;
  const { loadTodoFilesFromDisk } = useTask();

  const openFileDialog = useCallback(async () => {
    if (!open) {
      return;
    }
    onClose();
    const { fileName } = await getUniqueFilePath(defaultTodoFilePath);
    const filePath = await saveFile(fileName);
    if (filePath) {
      onCreateFile(filePath)
        .then(loadTodoFilesFromDisk)
        .catch((e) => console.debug(e));
    }
  }, [open, onClose, onCreateFile, loadTodoFilesFromDisk]);

  useEffect(() => {
    openFileDialog();
  }, [openFileDialog]);

  return null;
};

const WebFileCreateDialog = (props: FileCreateDialogProps) => {
  const { onCreateFile, onClose, open } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const [fileName, setFileName] = useState("");
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );
  const { uploadFile, cloudStorages } = useCloudStorage();
  const createExampleFile = useFileCreateDialogStore(
    (state) => state.createExampleFile,
  );
  const cleanupFileCreateDialog = useFileCreateDialogStore(
    (state) => state.cleanupFileCreateDialog,
  );
  const [selectedProvider, setSelectedProvider] = useState<
    Provider | "no-sync"
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
        selectedProvider &&
        selectedProvider !== "no-sync" &&
        cloudStorages.some((c) => c.provider === selectedProvider)
      ) {
        await uploadFile(selectedProvider, fileName, "");
      }
    },
    [onClose, onCreateFile, selectedProvider, cloudStorages, uploadFile],
  );

  const handleSave = async () => {
    if (!fileName) {
      return;
    }

    const exists = await fileExists(fileName);
    if (exists) {
      openConfirmationDialog({
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
    setSelectedProvider(event.target.value as Provider);
  };

  const handleExited = () => {
    cleanupFileCreateDialog();
    setFileName("");
    setSkip(undefined);
    setSelectedProvider("no-sync");
  };

  const init = useCallback(
    async (fileName?: string) => {
      if (!open || fileName) {
        return;
      }

      const { fileName: _fileName } =
        await getUniqueFilePath(defaultTodoFilePath);
      setFileName(_fileName);

      if (cloudStorages.length > 0) {
        setSkip(false);
        return;
      }

      const exists = await fileExists(defaultTodoFilePath);
      if (!exists) {
        await createTodoFileAndSync(_fileName);
        onClose();
        setSkip(true);
      } else {
        setSkip(false);
      }
    },
    [open, onClose, cloudStorages.length, createTodoFileAndSync],
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
      {cloudStorages.length > 0 && (
        <FormControl sx={{ mt: 1 }}>
          <FormLabel id="cloud-sync">
            {t("Sync with cloud storage", { provider: t("cloud storage") })}
          </FormLabel>
          <RadioGroup
            aria-labelledby="cloud-sync"
            aria-label="Sync with cloud storage"
            value={selectedProvider}
            onChange={handleCloudStorageChange}
          >
            <FormControlLabel
              value="no-sync"
              control={<Radio />}
              label={t("Not sync")}
            />
            {cloudStorages
              .map((c) => c.provider)
              .map((provider) => (
                <FormControlLabel
                  key={provider}
                  value={provider}
                  control={<Radio />}
                  label={provider}
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
