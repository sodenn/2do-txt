import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardReturnOutlinedIcon from "@mui/icons-material/KeyboardReturnOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { getDirname, join, selectFolder } from "../native-api/filesystem";
import useCloudFileDialogStore from "../stores/cloud-file-dialog-store";
import useFileCreateDialogStore from "../stores/file-create-dialog-store";
import useFilterStore from "../stores/filter-store";
import usePlatformStore from "../stores/platform-store";
import useSettingsStore from "../stores/settings-store";
import {
  CloudDirectory,
  CloudFile,
  CloudFileRef,
  ListResult,
  Provider,
  WithDirectoryType,
  WithFileType,
  useCloudStorage,
} from "../utils/CloudStorage";
import { getDoneFilePath } from "../utils/todo-files";
import useTask from "../utils/useTask";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";

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

const CloudFileDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
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
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    setLoading(false);
    setSelectedFile(undefined);
    closeCloudFileDialog();
  };

  const handleExited = () => {
    cleanupCloudFileDialog();
    setFiles(undefined);
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
        enqueueSnackbar(
          t("Task archiving was turned on because a done.txt file was found"),
          { variant: "info" },
        );
      }
    }

    setActiveTaskListPath(localFilePath);
    handleClose();
  };

  const handleCreateFile = () => {
    handleClose();
    openFileCreateDialog();
  };

  const TransitionProps = {
    onExited: handleExited,
  };

  if (fullScreenDialog) {
    return (
      <FullScreenDialog
        data-testid="cloud-file-dialog"
        open={open}
        onClose={handleClose}
        TransitionProps={TransitionProps}
      >
        <FullScreenDialogTitle
          onClose={handleClose}
          accept={{
            text: t("Import"),
            disabled: !selectedFile,
            loading,
            onClick: handleSelect,
            "aria-label": "Import",
          }}
        >
          {provider}
        </FullScreenDialogTitle>
        <FullScreenDialogContent disableGutters>
          <CloudFileDialogContent
            provider={provider}
            onSelect={setSelectedFile}
            onFilesChange={setFiles}
            onClose={handleClose}
          />
        </FullScreenDialogContent>
      </FullScreenDialog>
    );
  }

  return (
    <Dialog
      maxWidth="xs"
      fullWidth
      scroll="paper"
      open={open}
      onClose={handleClose}
      TransitionProps={TransitionProps}
    >
      <DialogTitle sx={{ px: 2 }}>
        {t(`Import from cloud storage`, {
          provider,
        })}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <CloudFileDialogContent
          provider={provider}
          onSelect={setSelectedFile}
          onFilesChange={setFiles}
          onClose={handleClose}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        {files && files.items.length > 0 && (
          <LoadingButton
            onClick={handleSelect}
            disabled={!selectedFile}
            loading={loading}
          >
            {t("Import")}
          </LoadingButton>
        )}
        {files && files.items.length === 0 && taskLists.length === 0 && (
          <Button onClick={handleCreateFile}>{t("Create todo.txt")}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const CloudFileDialogContent = (props: CloudFileDialogContentProps) => {
  const { provider, onSelect, onFilesChange, onClose } = props;
  const { t } = useTranslation();
  const { taskLists } = useTask();
  const { enqueueSnackbar } = useSnackbar();
  const { list, getCloudFileRefs } = useCloudStorage();
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListResult | undefined>();
  const [cloudFileRefs, setCloudFileRefs] = useState<CloudFileRef[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [previousPaths, setPreviousPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean | number>(true);
  const disabled =
    loading === true || (typeof loading === "number" && loading >= 0);

  const handleSelect = (cloudFile: CloudFile) => {
    setSelectedFile(cloudFile);
    onSelect(cloudFile);
  };

  const handleNavForward = async (
    cloudDirectory: CloudDirectory,
    index: number,
  ) => {
    setLoading(index);
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
            enqueueSnackbar(
              <span>
                <Trans
                  i18nKey="Error connecting with cloud storage"
                  values={{ provider, message: e.message }}
                  components={{ code: <code style={{ marginLeft: 5 }} /> }}
                />
              </span>,
              { variant: "warning" },
            );
          })
          .finally(() => setLoading(false));
      }
    },
    [provider, currentPath, enqueueSnackbar, list, onClose, onFilesChange],
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
        <Box sx={{ textAlign: "center", my: 3 }}>
          <CircularProgress size={30} />
        </Box>
      )}
      {files && files.items.length === 0 && (
        <Typography sx={{ px: 2, mb: 1 }}>
          {t("There are no todo.txt files", { provider })}
        </Typography>
      )}
      {files && files.items.length === 0 && taskLists.length > 0 && (
        <Typography variant="body2" sx={{ px: 2 }} color="text.disabled">
          <Trans i18nKey="Existing todo.txt files can be synchronized" />
        </Typography>
      )}
      {files && files.items.length > 0 && (
        <List sx={{ py: 0 }} dense>
          {previousPaths.length > 0 && (
            <ListItemButton onClick={() => handleNavBack()}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {loading === true ? (
                  <CircularProgress color="inherit" size={24} />
                ) : (
                  <KeyboardReturnOutlinedIcon />
                )}
              </ListItemIcon>
              <ListItemText primary={previousPaths.at(-1) || t("Back")} />
            </ListItemButton>
          )}
          {files.items
            .filter((c): c is CloudFile & WithFileType => c.type === "file")
            .map((cloudFile, idx) => (
              <CloudFileButton
                key={idx}
                cloudFile={cloudFile}
                cloudFileRefs={cloudFileRefs}
                selectedFile={selectedFile}
                onClick={() => handleSelect(cloudFile)}
                disabled={disabled}
              />
            ))}
          {files.items
            .filter(
              (c): c is CloudDirectory & WithDirectoryType =>
                c.type === "directory",
            )
            .map((cloudDirectory, idx) => (
              <CloudFolderButton
                key={idx}
                cloudDirectory={cloudDirectory}
                onClick={() => handleNavForward(cloudDirectory, idx)}
                loading={loading === idx}
                disabled={disabled}
              />
            ))}
          {files?.hasMore && (
            <ListItemButton onClick={() => handleLoadMoreItems()}>
              <ListItemText inset primary={t("Load more")} />
            </ListItemButton>
          )}
        </List>
      )}
    </>
  );
};

const CloudFileButton = (props: CloudFileButtonProps) => {
  const { cloudFile, cloudFileRefs, selectedFile, disabled, onClick } = props;

  const disableItem = (cloudFile: CloudFile) => {
    return cloudFileRefs.some((c) => c.path === cloudFile.path);
  };

  return (
    <ListItemButton
      disabled={disableItem(cloudFile) || disabled}
      onClick={onClick}
      selected={selectedFile && cloudFile.path === selectedFile.path}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <InsertDriveFileOutlinedIcon />
      </ListItemIcon>
      <ListItemText primary={cloudFile.name} secondary={cloudFile.path} />
      {disableItem(cloudFile) && <SyncOutlinedIcon color="disabled" />}
    </ListItemButton>
  );
};

const CloudFolderButton = (props: CloudFolderButtonProps) => {
  const { cloudDirectory, loading, disabled, onClick } = props;

  return (
    <ListItemButton onClick={onClick} disabled={disabled}>
      <ListItemIcon sx={{ minWidth: 40 }}>
        <FolderOutlinedIcon />
      </ListItemIcon>
      <ListItemText
        primary={cloudDirectory.name}
        secondary={cloudDirectory.path}
      />
      {loading ? (
        <CircularProgress color="inherit" size={24} />
      ) : (
        <ArrowForwardIosOutlinedIcon color="disabled" />
      )}
    </ListItemButton>
  );
};

export default CloudFileDialog;
