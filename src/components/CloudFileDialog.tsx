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
import {
  CloudFile,
  CloudFileRef,
  CloudFolder,
  CloudStorage,
  ListCloudItemResult,
  useCloudFileDialog,
  useCloudStorage,
} from "../data/CloudStorageContext";
import generateContentHash from "../data/CloudStorageContext/ContentHasher";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { getArchiveFilePath, getFilesystem } from "../utils/filesystem";
import { getPlatform } from "../utils/platform";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";

interface CloudFileDialogContentProps {
  cloudStorage?: CloudStorage;
  onSelect: (cloudFile?: CloudFile) => void;
  onFilesChange: (files?: ListCloudItemResult) => void;
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
  cloudFolder: CloudFolder;
  loading: boolean;
  onClick: () => void;
}

const CloudFileDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const { createNewTodoFile, saveDoneFile, taskLists } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const { downloadFile, linkCloudFile, linkCloudArchiveFile } =
    useCloudStorage();
  const {
    cloudFileDialogOptions: { open, cloudStorage },
    setCloudFileDialogOptions,
  } = useCloudFileDialog();
  const platform = getPlatform();
  const { selectFolder, join } = getFilesystem();
  const { setFileCreateDialog } = useFileCreateDialog();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListCloudItemResult | undefined>();
  const { archiveMode, setArchiveMode } = useSettings();
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    setLoading(false);
    setSelectedFile(undefined);
    setCloudFileDialogOptions((currentValue) => ({
      ...currentValue,
      open: false,
    }));
  };

  const handleExited = () => {
    setCloudFileDialogOptions({ open: false });
    setFiles(undefined);
  };

  const handleSelect = async () => {
    if (!selectedFile || !open || !cloudStorage) {
      return;
    }

    setLoading(true);

    const text = await downloadFile({
      cloudFilePath: selectedFile.path,
      cloudStorage,
    });

    let filePath: string;
    if (platform === "electron") {
      const folder = await selectFolder(t("Select folder"));
      if (!folder) {
        setLoading(false);
        return;
      }
      filePath = await join(folder, selectedFile.name);
    } else {
      filePath = selectedFile.name;
    }

    await createNewTodoFile(filePath, text);

    const archiveFilePath = getArchiveFilePath(selectedFile.path);
    const archiveFile = files?.items.find((i) => i.path === archiveFilePath) as
      | CloudFile
      | undefined;
    if (archiveFile && archiveFilePath) {
      const archiveText = await downloadFile({
        cloudFilePath: archiveFile.path,
        cloudStorage,
      });
      await saveDoneFile(filePath, archiveText);
      await linkCloudArchiveFile({
        ...archiveFile,
        contentHash: generateContentHash(archiveText),
        localFilePath: filePath,
        cloudStorage,
      });
      if (archiveMode === "no-archiving") {
        await setArchiveMode("manual");
        enqueueSnackbar(
          t("Task archiving was turned on because a done.txt file was found"),
          { variant: "info" }
        );
      }
    }

    await linkCloudFile({
      ...selectedFile,
      contentHash: generateContentHash(text),
      localFilePath: filePath,
      lastSync: new Date().toISOString(),
      cloudStorage,
    });
    setActiveTaskListPath(filePath);
    handleClose();
  };

  const handleCreateFile = () => {
    handleClose();
    setFileCreateDialog({ open: true });
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
            onClick: handleSelect,
            "aria-label": "Import",
          }}
        >
          {cloudStorage}
        </FullScreenDialogTitle>
        <FullScreenDialogContent disableGutters>
          <CloudFileDialogContent
            cloudStorage={cloudStorage}
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
          cloudStorage,
        })}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <CloudFileDialogContent
          cloudStorage={cloudStorage}
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
  const { cloudStorage, onSelect, onFilesChange, onClose } = props;
  const { t } = useTranslation();
  const { taskLists } = useTask();
  const { enqueueSnackbar } = useSnackbar();
  const { listCloudFiles, getCloudFileRefs } = useCloudStorage();
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListCloudItemResult | undefined>();
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

  const handleNavForward = async (cloudFolder: CloudFolder, index: number) => {
    setLoading(index);
    await loadItems(cloudFolder.path);
    setPreviousPaths((curr) => [...curr, currentPath]);
    setCurrentPath(cloudFolder.path);
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
      if (cloudStorage) {
        return listCloudFiles({ path, cloudStorage })
          .then((result) => {
            if (result) {
              setFiles(result);
              onFilesChange(result);
            }
          })
          .catch((e: any) => {
            onClose();
            enqueueSnackbar(
              <Trans
                i18nKey="Error connecting with cloud storage"
                values={{ cloudStorage, message: e.message }}
                components={{ code: <code style={{ marginLeft: 5 }} /> }}
              />,
              { variant: "warning" }
            );
          })
          .finally(() => setLoading(false));
      }
    },
    [
      cloudStorage,
      currentPath,
      enqueueSnackbar,
      listCloudFiles,
      onClose,
      onFilesChange,
    ]
  );

  const handleLoadMoreItems = (path = currentPath) => {
    if (cloudStorage && files && files.hasMore && files.cursor) {
      setLoading(true);
      listCloudFiles({ path, cursor: files.cursor, cloudStorage })
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
      .then((refs) => refs.filter((ref) => ref.cloudStorage === cloudStorage))
      .then((refs) =>
        refs.filter((ref) =>
          taskLists.some((t) => t.filePath === ref.localFilePath)
        )
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
          {t("There are no todo.txt files", { cloudStorage })}
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
            .filter((c): c is CloudFile => c.type === "file")
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
            .filter((c): c is CloudFolder => c.type === "folder")
            .map((cloudFolder, idx) => (
              <CloudFolderButton
                key={idx}
                cloudFolder={cloudFolder}
                onClick={() => handleNavForward(cloudFolder, idx)}
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
  const { cloudFolder, loading, disabled, onClick } = props;

  return (
    <ListItemButton onClick={onClick} disabled={disabled}>
      <ListItemIcon sx={{ minWidth: 40 }}>
        <FolderOutlinedIcon />
      </ListItemIcon>
      <ListItemText primary={cloudFolder.name} secondary={cloudFolder.path} />
      {loading ? (
        <CircularProgress color="inherit" size={24} />
      ) : (
        <ArrowForwardIosOutlinedIcon color="disabled" />
      )}
    </ListItemButton>
  );
};

export default CloudFileDialog;
