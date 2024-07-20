import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
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
import { useTask } from "@/utils/useTask";
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

  const handleSave = async () => {
    if (!fileName) {
      return;
    }
    const exists = await fileExists(fileName);
    if (exists) {
      openConfirmationDialog({
        title: t("File already exists"),
        content: (
          <Trans
            i18nKey="todo.txt already exists. Do you want to replace it"
            values={{ filePath: fileName }}
          />
        ),
        buttons: [
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

  const reset = useCallback(() => {
    cleanupFileCreateDialog();
    setFileName("");
    setSkip(undefined);
    setSelectedProvider("no-sync");
  }, [cleanupFileCreateDialog]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(reset, 200);
  }, [reset, onClose]);

  const createTodoFileAndSync = useCallback(
    async (fileName: string) => {
      handleClose();
      await onCreateFile(fileName);
      if (
        selectedProvider &&
        selectedProvider !== "no-sync" &&
        cloudStorages.some((c) => c.provider === selectedProvider)
      ) {
        await uploadFile(selectedProvider, fileName, "");
      }
    },
    [handleClose, onCreateFile, selectedProvider, cloudStorages, uploadFile],
  );

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
      handleClose();
      reset();
      setSkip(true);
    } else {
      setSkip(false);
    }
  }, [
    open,
    fileName,
    cloudStorages.length,
    createTodoFileAndSync,
    handleClose,
    reset,
  ]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ResponsiveDialog
      open={open && typeof skip !== "undefined" && !skip}
      onClose={handleClose}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="space-y-2">
            <div className="mb-1 space-y-1">
              <Label htmlFor="file-name">{t("File Name")}</Label>
              <Input
                id="file-name"
                autoFocus
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                aria-label="File name"
                className="w-full"
              />
            </div>
            {cloudStorages.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="file-name">
                  {t("Sync with cloud storage", {
                    provider: t("cloud storage"),
                  })}
                </Label>
                <RadioGroup
                  aria-label="Sync with cloud storage"
                  value={selectedProvider}
                  onChange={handleCloudStorageChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no-sync" id="no-sync" />
                    <Label htmlFor="no-sync">{t("Not sync")}</Label>
                  </div>
                  {cloudStorages
                    .map((c) => c.provider)
                    .map((provider) => (
                      <div
                        key={provider}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value={provider} id={provider} />
                        <Label htmlFor={provider}>{provider}</Label>
                      </div>
                    ))}
                </RadioGroup>
              </div>
            )}
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button
            aria-label="Create file"
            disabled={!fileName}
            onClick={handleSave}
          >
            {t("Create")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
