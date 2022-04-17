import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import {
  CloudFile,
  CloudFileRef,
  ListCloudItemResult,
} from "../types/cloud-storage.types";
import { getArchiveFilePath } from "../utils/filesystem";
import { ResponsiveDialog } from "./ResponsiveDialog";
import StartEllipsis from "./StartEllipsis";

const root = "";

const CloudFileDialog = () => {
  const { t } = useTranslation();
  const { createNewTodoFile, saveDoneFile, taskLists } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const {
    listCloudFiles,
    downloadFile,
    linkCloudFile,
    linkCloudArchiveFile,
    getCloudFileRefs,
    cloudFileDialogOptions: { open, cloudStorage },
    setCloudFileDialogOptions,
  } = useCloudStorage();
  const { setFileCreateDialogOpen } = useFileCreateDialog();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListCloudItemResult | undefined>();
  const [cloudFileRefs, setCloudFileRefs] = useState<CloudFileRef[]>([]);
  const { archiveMode, setArchiveMode } = useSettings();
  const { enqueueSnackbar } = useSnackbar();
  const listItems = !files
    ? []
    : files.items
        .filter((i) => i.type !== "folder")
        .filter(
          (i) =>
            i.name !== process.env.REACT_APP_ARCHIVAL_FILE_NAME &&
            !i.name.endsWith(`_${process.env.REACT_APP_ARCHIVAL_FILE_NAME}`)
        );

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
    setCloudFileRefs([]);
  };

  const handleSelect = async (selectedFile?: CloudFile) => {
    if (!selectedFile || !open || !cloudStorage) {
      return;
    }

    setLoading(true);

    const text = await downloadFile({
      cloudFilePath: selectedFile.path,
      cloudStorage,
    });

    await createNewTodoFile(selectedFile.name, text);

    const archiveFilePath = getArchiveFilePath(selectedFile.path);

    const archiveFile = files?.items.find((i) => i.path === archiveFilePath) as
      | CloudFile
      | undefined;

    if (archiveFile && archiveFilePath) {
      const archiveText = await downloadFile({
        cloudFilePath: archiveFile.path,
        cloudStorage,
      });
      await saveDoneFile(selectedFile.name, archiveText);
      await linkCloudArchiveFile({
        ...archiveFile,
        localFilePath: selectedFile.name,
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
      localFilePath: selectedFile.name,
      lastSync: new Date().toISOString(),
      cloudStorage,
    });
    setActiveTaskListPath(selectedFile.name);

    handleClose();
  };

  const handleCreateFile = () => {
    handleClose();
    setFileCreateDialogOpen(true);
  };

  const handleLoadItems = useCallback(
    (path = root) => {
      if (cloudStorage) {
        listCloudFiles({ path, cloudStorage }).then((result) => {
          if (result) {
            setFiles(result);
          }
        });
      }
    },
    [cloudStorage, listCloudFiles]
  );

  const handleLoadMoreItems = (path = root) => {
    if (cloudStorage && files && files.hasMore && files.cursor) {
      listCloudFiles({ path, cursor: files.cursor, cloudStorage }).then(
        (result) => {
          if (result) {
            result.items = [...files.items, ...result.items];
            setFiles(result);
          }
        }
      );
    }
  };

  const disableItem = (cloudFile: CloudFile) => {
    return cloudFileRefs.some((c) => c.path === cloudFile.path);
  };

  const listItemTitle = (cloudFile: CloudFile) => {
    const doneFile = files?.items.find(
      (i) => i.path === getArchiveFilePath(cloudFile.path)
    );
    if (doneFile) {
      return `${cloudFile.name} + ${doneFile.name}`;
    } else {
      return cloudFile.name;
    }
  };

  useEffect(() => {
    if (open) {
      handleLoadItems(root);
      getCloudFileRefs()
        .then((refs) => refs.filter((ref) => ref.cloudStorage === cloudStorage))
        .then(setCloudFileRefs);
    }
  }, [handleLoadItems, open, getCloudFileRefs, cloudStorage]);

  return (
    <ResponsiveDialog
      maxWidth="xs"
      fullWidth
      scroll="paper"
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: handleExited,
      }}
    >
      <DialogTitle sx={{ px: 2 }}>
        {t(`Import from cloud storage`, {
          cloudStorage,
        })}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {!files && (
          <Box sx={{ textAlign: "center", my: 2 }}>
            <CircularProgress />
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
        {listItems.length > 0 && (
          <List sx={{ py: 0 }} dense>
            {listItems
              .map((i) => i as CloudFile)
              .map((cloudFile, idx) => (
                <ListItem
                  button
                  disabled={disableItem(cloudFile)}
                  key={idx}
                  onClick={() => setSelectedFile(cloudFile)}
                  onDoubleClick={() => handleSelect(cloudFile)}
                  selected={
                    selectedFile && cloudFile.path === selectedFile.path
                  }
                >
                  <Box sx={{ overflow: "hidden", flex: 1 }}>
                    <StartEllipsis sx={{ my: 0.5 }}>
                      {listItemTitle(cloudFile)}
                    </StartEllipsis>
                    <StartEllipsis
                      sx={{ my: 0.5 }}
                      variant="body2"
                      color="text.secondary"
                    >
                      {cloudFile.path}
                    </StartEllipsis>
                  </Box>
                  {disableItem(cloudFile) && (
                    <Box sx={{ ml: 2 }}>
                      <SyncOutlinedIcon color="disabled" />
                    </Box>
                  )}
                </ListItem>
              ))}
            {files?.hasMore && (
              <ListItem button onClick={() => handleLoadMoreItems()}>
                <StartEllipsis sx={{ my: 0.5 }}>{t("Load more")}</StartEllipsis>
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        {files && files.items.length > 0 && (
          <LoadingButton
            onClick={() => handleSelect(selectedFile)}
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
    </ResponsiveDialog>
  );
};

export default CloudFileDialog;
