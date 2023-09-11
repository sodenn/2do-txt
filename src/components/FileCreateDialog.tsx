import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import {
  fileExists,
  getUniqueFilePath,
  saveFile,
} from "@/native-api/filesystem";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { Provider, useCloudStorage } from "@/utils/CloudStorage";
import { addTodoFilePath } from "@/utils/settings";
import { defaultTodoFilePath } from "@/utils/todo-files";
import { useDialogButtonSize } from "@/utils/useDialogButtonSize";
import { useTask } from "@/utils/useTask";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
} from "@mui/joy";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface FileCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateFile: (filePath: string) => Promise<void>;
}

export function FileCreateDialog() {
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
}

function DesktopFileCreateDialog(props: FileCreateDialogProps) {
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
}

const WebFileCreateDialog = (props: FileCreateDialogProps) => {
  const { onCreateFile, onClose, open } = props;
  const { t } = useTranslation();
  const buttonSize = useDialogButtonSize();
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

  const init = useCallback(async () => {
    if (!open || fileName) {
      return;
    }

    const { fileName: uniqueFileName } =
      await getUniqueFilePath(defaultTodoFilePath);
    setFileName(uniqueFileName);

    if (cloudStorages.length > 0) {
      setSkip(false);
      return;
    }

    const exists = await fileExists(defaultTodoFilePath);
    if (!exists) {
      await createTodoFileAndSync(uniqueFileName);
      onClose();
      setSkip(true);
    } else {
      setSkip(false);
    }
  }, [open, fileName, cloudStorages.length, createTodoFileAndSync, onClose]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ResponsiveDialog
      fullWidth
      open={open && typeof skip !== "undefined" && !skip}
      onClose={onClose}
      onExited={handleExited}
    >
      <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <FormControl>
          <FormLabel>{t("File Name")}</FormLabel>
          <Input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            fullWidth
            variant="outlined"
            slotProps={{
              input: {
                "aria-label": "File name",
              },
            }}
          />
        </FormControl>
        {cloudStorages.length > 0 && (
          <FormControl>
            <FormLabel>
              {t("Sync with cloud storage", { provider: t("cloud storage") })}
            </FormLabel>
            <RadioGroup
              aria-label="Sync with cloud storage"
              value={selectedProvider}
              onChange={handleCloudStorageChange}
            >
              <Radio value="no-sync" label={t("Not sync")} />
              {cloudStorages
                .map((c) => c.provider)
                .map((provider) => (
                  <Radio key={provider} value={provider} label={provider} />
                ))}
            </RadioGroup>
          </FormControl>
        )}
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <Button
          size={buttonSize}
          aria-label="Create file"
          disabled={!fileName}
          onClick={handleSave}
        >
          {t("Create")}
        </Button>
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  );
};
