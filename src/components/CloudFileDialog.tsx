import { useSnackbar } from "@/components/Snackbar";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { getDirname, join, selectFolder } from "@/native-api/filesystem";
import { useCloudFileDialogStore } from "@/stores/cloud-file-dialog-store";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  CloudDirectory,
  CloudFile,
  CloudFileRef,
  ListResult,
  Provider,
  WithDirectoryType,
  WithFileType,
  useCloudStorage,
} from "@/utils/CloudStorage";
import { getDoneFilePath } from "@/utils/todo-files";
import { cn } from "@/utils/tw-utils";
import { useTask } from "@/utils/useTask";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  CornerDownLeftIcon,
  FileTextIcon,
  FolderIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface CloudFileDialogContentProps {
  provider?: Provider;
  onSelect: (cloudFile?: CloudFile) => void;
  onFilesChange: (files?: ListResult) => void;
  onClose: () => void;
}

interface CloudFileButtonProps {
  disabled: boolean;
  cloudFile: CloudFile;
  cloudFileRefs: CloudFileRef[];
  onClick: () => void;
  selectedFile?: CloudFile;
}

interface CloudFolderButtonProps {
  disabled: boolean;
  cloudDirectory: CloudDirectory;
  loading: boolean;
  onClick: () => void;
}

export function CloudFileDialog() {
  const { t } = useTranslation();
  const { createNewTodoFile, saveDoneFile, taskLists } = useTask();
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const setArchiveMode = useSettingsStore((state) => state.setArchiveMode);
  const { downloadFile } = useCloudStorage();
  const open = useCloudFileDialogStore((state) => state.open);
  const provider = useCloudFileDialogStore((state) => state.provider);
  const closeCloudFileDialog = useCloudFileDialogStore(
    (state) => state.closeCloudFileDialog,
  );
  const cleanupCloudFileDialog = useCloudFileDialogStore(
    (state) => state.cleanupCloudFileDialog,
  );
  const platform = usePlatformStore((state) => state.platform);
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListResult | undefined>();
  const { openSnackbar } = useSnackbar();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const handleClose = () => {
    setLoading(false);
    setSelectedFile(undefined);
    closeCloudFileDialog();
    setTimeout(() => {
      cleanupCloudFileDialog();
      setFiles(undefined);
    }, 200);
  };

  const handleSelect = async () => {
    if (!selectedFile || !open || !provider) {
      return;
    }
    setLoading(true);
    const remoteFilePath = selectedFile.path;
    let localFilePath: string;
    if (platform === "desktop") {
      const folder = await selectFolder();
      if (!folder) {
        setLoading(false);
        return;
      }
      localFilePath = await join(folder, selectedFile.name);
    } else {
      localFilePath = selectedFile.name;
    }
    const content = await downloadFile(provider, localFilePath, remoteFilePath);
    await createNewTodoFile(localFilePath, content);
    const remoteDoneFilePath = getDoneFilePath(remoteFilePath);
    const doneFile = files?.items.find((i) => i.path === remoteDoneFilePath) as
      | CloudFile
      | undefined;
    if (doneFile && remoteDoneFilePath) {
      const localDoneFilePath = await join(
        getDirname(localFilePath),
        doneFile.name,
      );
      const doneFileContent = await downloadFile(
        provider,
        localDoneFilePath,
        remoteDoneFilePath,
      );
      await saveDoneFile(localDoneFilePath, doneFileContent);
      if (archiveMode === "no-archiving") {
        setArchiveMode("manual");
        openSnackbar({
          color: "primary",
          message: t(
            "Task archiving was turned on because a done.txt file was found",
          ),
        });
      }
    }
    setActiveTaskListPath(localFilePath);
    handleClose();
  };

  const handleCreateFile = () => {
    handleClose();
    openFileCreateDialog();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t(`Import from cloud storage`, {
              provider,
            })}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <CloudFileDialogContent
            provider={provider}
            onSelect={setSelectedFile}
            onFilesChange={setFiles}
            onClose={handleClose}
          />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {files && files.items.length > 0 && (
            <Button
              onClick={handleSelect}
              disabled={!selectedFile}
              loading={loading}
              aria-label="Import"
            >
              {t("Import")}
            </Button>
          )}
          {files && files.items.length === 0 && taskLists.length === 0 && (
            <Button onClick={handleCreateFile}>{t("Create todo.txt")}</Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function CloudFileDialogContent(props: CloudFileDialogContentProps) {
  const { provider, onSelect, onFilesChange, onClose } = props;
  const { t } = useTranslation();
  const { taskLists } = useTask();
  const { openSnackbar } = useSnackbar();
  const { list, getCloudFileRefs } = useCloudStorage();
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListResult | undefined>();
  const [cloudFileRefs, setCloudFileRefs] = useState<CloudFileRef[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [previousPaths, setPreviousPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean | string>(true);
  const disabled =
    loading === true || (typeof loading === "number" && loading >= 0);

  const handleSelect = (cloudFile: CloudFile) => {
    setSelectedFile(cloudFile);
    onSelect(cloudFile);
  };

  const handleNavForward = async (cloudDirectory: CloudDirectory) => {
    setLoading(cloudDirectory.path);
    await loadItems(cloudDirectory.path);
    setPreviousPaths((curr) => [...curr, currentPath]);
    setCurrentPath(cloudDirectory.path);
    setSelectedFile(undefined);
    onSelect(undefined);
  };

  const handleNavBack = async () => {
    setLoading(true);
    const newPreviousPaths = previousPaths.slice(0, -1);
    const newCurrentFile = newPreviousPaths.at(-1) ?? "";
    await loadItems(newCurrentFile);
    setPreviousPaths(newPreviousPaths);
    setCurrentPath(newCurrentFile);
    setSelectedFile(undefined);
    onSelect(undefined);
  };

  const loadItems = useCallback(
    async (path = currentPath) => {
      if (provider) {
        return list(provider, path)
          .then((result) => {
            if (result) {
              setFiles(result);
              onFilesChange(result);
            }
          })
          .catch((e: any) => {
            onClose();
            openSnackbar({
              color: "warning",
              message: (
                <Trans
                  i18nKey="Error connecting with cloud storage"
                  values={{ provider, message: e.message }}
                  components={{ code: <code style={{ marginLeft: 5 }} /> }}
                />
              ),
            });
          })
          .finally(() => setLoading(false));
      }
    },
    [provider, currentPath, openSnackbar, list, onClose, onFilesChange],
  );

  const handleLoadMoreItems = (path = currentPath) => {
    if (provider && files && files.hasMore && files.cursor) {
      setLoading(true);
      list(provider, path, files.cursor)
        .then((result) => {
          if (result) {
            result.items = [...files.items, ...result.items];
            setFiles(result);
            onFilesChange(result);
          }
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadItems(currentPath);
    getCloudFileRefs()
      .then((refs) => refs.filter((ref) => ref.provider === provider))
      .then((refs) =>
        refs.filter((ref) =>
          taskLists.some((t) => t.filePath === ref.identifier),
        ),
      )
      .then(setCloudFileRefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!files && (
        <div className="text-center, my-3">
          <LoadingSpinner />
        </div>
      )}
      {((files && files.items.length > 0) || previousPaths.length > 0) && (
        <ul className="my-1 flex flex-col">
          {previousPaths.length > 0 && (
            <button
              className={cn(
                "flex items-center gap-4 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              )}
              onClick={() => handleNavBack()}
            >
              {loading === true ? (
                <LoadingSpinner />
              ) : (
                <CornerDownLeftIcon className="h-5 w-5 shrink-0" />
              )}
              {previousPaths.at(-1) || t("Back")}
              <div className="text-sm font-medium leading-none">
                {previousPaths.at(-1) || t("Back")}
              </div>
            </button>
          )}
          {files &&
            files.items
              .filter((c): c is CloudFile & WithFileType => c.type === "file")
              .map((cloudFile) => (
                <CloudFileButton
                  key={cloudFile.path}
                  cloudFile={cloudFile}
                  cloudFileRefs={cloudFileRefs}
                  selectedFile={selectedFile}
                  onClick={() => handleSelect(cloudFile)}
                  disabled={disabled}
                />
              ))}
          {files &&
            files.items
              .filter(
                (c): c is CloudDirectory & WithDirectoryType =>
                  c.type === "directory",
              )
              .map((cloudDirectory) => (
                <CloudFolderButton
                  key={cloudDirectory.path}
                  cloudDirectory={cloudDirectory}
                  onClick={() => handleNavForward(cloudDirectory)}
                  loading={loading === cloudDirectory.path}
                  disabled={disabled}
                />
              ))}
          {files && files.hasMore && (
            <li className="pl-4" onClick={() => handleLoadMoreItems()}>
              {t("Load more")}
            </li>
          )}
          {files && files.items.length === 0 && (
            <li>{t("No todo.txt files found")}</li>
          )}
        </ul>
      )}
    </>
  );
}

function CloudFileButton(props: CloudFileButtonProps) {
  const { cloudFile, cloudFileRefs, selectedFile, disabled, onClick } = props;

  const disableItem = (cloudFile: CloudFile) => {
    return cloudFileRefs.some((c) => c.path === cloudFile.path);
  };

  return (
    <button
      disabled={disableItem(cloudFile) || disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        selectedFile &&
          cloudFile.path === selectedFile.path &&
          "bg-accent text-accent-foreground",
      )}
    >
      <FileTextIcon className="h-4 w-4 shrink-0" />
      <div className="flex-1 text-left">
        <div className="text-sm font-medium leading-none">{cloudFile.name}</div>
        <div className="truncate text-sm text-muted-foreground">
          {cloudFile.path}
        </div>
      </div>
      {disableItem(cloudFile) && (
        <RefreshCwIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

function CloudFolderButton(props: CloudFolderButtonProps) {
  const { cloudDirectory, loading, disabled, onClick } = props;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-4 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <FolderIcon className="h-5 w-5 shrink-0" />
      <div className="flex-1 text-left">
        <div className="text-sm font-medium leading-none">
          {cloudDirectory.name}
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {cloudDirectory.path}
        </div>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ArrowForwardIosIcon color="disabled" fontSize="small" />
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <LoaderCircleIcon className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
  );
}
