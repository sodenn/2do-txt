import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
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
import React, { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import {
  CloudFile,
  CloudFileRef,
  ListCloudItemResult,
} from "../types/cloud-storage.types";
import { ResponsiveDialog } from "./ResponsiveDialog";
import StartEllipsis from "./StartEllipsis";

const root = "";

const CloudFileDialog = () => {
  const { t } = useTranslation();
  const { createNewTodoFile } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const {
    listFiles,
    downloadFile,
    linkFile,
    getCloudFileRefs,
    cloudFileDialogOptions,
    setCloudFileDialogOptions,
  } = useCloudStorage();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListCloudItemResult | undefined>();
  const [cloudFileRefs, setCloudFileRefs] = useState<CloudFileRef[]>([]);

  const handleClose = () => {
    setCloudFileDialogOptions({ open: false });
    setLoading(false);
    setSelectedFile(undefined);
  };

  const handleSelect = async () => {
    if (!selectedFile || !cloudFileDialogOptions.open) {
      return;
    }

    const { cloudStorage } = cloudFileDialogOptions;

    setLoading(true);

    const text = await downloadFile({
      cloudFilePath: selectedFile.path,
      cloudStorage,
    });
    await createNewTodoFile(selectedFile.name, text);
    await linkFile({
      ...selectedFile,
      localFilePath: selectedFile.name,
      lastSync: new Date().toISOString(),
      cloudStorage,
    });
    setActiveTaskListPath(selectedFile.name);

    handleClose();
  };

  const handleLoadItems = useCallback(
    (path = root) => {
      if (cloudFileDialogOptions.open) {
        const { cloudStorage } = cloudFileDialogOptions;
        listFiles({ path, cloudStorage }).then((result) => {
          if (result) {
            setFiles(result);
          }
        });
      }
    },
    [cloudFileDialogOptions, listFiles]
  );

  const handleLoadMoreItems = (path = root) => {
    if (cloudFileDialogOptions.open && files && files.hasMore && files.cursor) {
      const { cloudStorage } = cloudFileDialogOptions;
      listFiles({ path, cursor: files.cursor, cloudStorage }).then((result) => {
        if (result) {
          result.items = [...files.items, ...result.items];
          setFiles(result);
        }
      });
    }
  };

  const disableItem = (cloudFile: CloudFile) => {
    return cloudFileRefs.some((c) => c.path === cloudFile.path);
  };

  useEffect(() => {
    if (cloudFileDialogOptions.open) {
      const { cloudStorage } = cloudFileDialogOptions;
      handleLoadItems(root);
      getCloudFileRefs()
        .then((refs) => refs.filter((ref) => ref.cloudStorage === cloudStorage))
        .then(setCloudFileRefs);
    }
  }, [handleLoadItems, cloudFileDialogOptions, getCloudFileRefs]);

  return (
    <ResponsiveDialog
      maxWidth="xs"
      fullWidth
      scroll="paper"
      open={cloudFileDialogOptions.open}
      onClose={handleClose}
    >
      {cloudFileDialogOptions.open && (
        <DialogTitle sx={{ px: 2 }}>
          {t(`Import from Cloud Storage`, {
            cloudStorage: cloudFileDialogOptions.cloudStorage,
          })}
        </DialogTitle>
      )}
      <DialogContent sx={{ p: 0 }}>
        {!files && (
          <Box sx={{ textAlign: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {files && files.items.length === 0 && (
          <Typography sx={{ px: 2, fontStyle: "italic" }} color="text.disabled">
            <Trans i18nKey="No todo.txt files uploaded yet" />
          </Typography>
        )}
        {files && files.items.length > 0 && (
          <List sx={{ py: 0 }} dense>
            {files.items
              .filter((i) => i.type !== "folder")
              .map((i) => i as CloudFile)
              .map((cloudFile, idx) => (
                <ListItem
                  button
                  disabled={disableItem(cloudFile)}
                  key={idx}
                  onClick={() => setSelectedFile(cloudFile)}
                  selected={
                    selectedFile && cloudFile.path === selectedFile.path
                  }
                >
                  <Box sx={{ overflow: "hidden", flex: 1 }}>
                    <StartEllipsis sx={{ my: 0.5 }}>
                      {cloudFile.name}
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
                      <CloudOutlinedIcon color="disabled" />
                    </Box>
                  )}
                </ListItem>
              ))}
            {files.hasMore && (
              <ListItem button onClick={() => handleLoadMoreItems()}>
                <StartEllipsis sx={{ my: 0.5 }}>{t("Load more")}</StartEllipsis>
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        <LoadingButton
          onClick={handleSelect}
          disabled={!selectedFile}
          loading={loading}
        >
          {t("Import")}
        </LoadingButton>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default CloudFileDialog;
