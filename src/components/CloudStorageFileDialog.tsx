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
import { useTask } from "../data/TaskContext";
import {
  CloudFile,
  CloudFileRef,
  ListCloudFilesResult,
} from "../types/cloud-storage.types";
import { ResponsiveDialog } from "./ResponsiveDialog";
import StartEllipsis from "./StartEllipsis";

const root = "";

const CloudStorageFileDialog = () => {
  const { t } = useTranslation();
  const { createNewTodoFile } = useTask();
  const {
    listFiles,
    cloudStorage,
    downloadFile,
    linkFile,
    getCloudFileRefs,
    cloudStorageFileDialogOpen,
    setCloudStorageFileDialogOpen,
  } = useCloudStorage();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListCloudFilesResult | undefined>();
  const [cloudFileRefs, setCloudFileRefs] = useState<CloudFileRef[]>([]);

  const handleClose = () => {
    setCloudStorageFileDialogOpen(false);
    setLoading(false);
    setSelectedFile(undefined);
  };

  const handleSelect = async () => {
    if (!selectedFile) {
      return;
    }

    setLoading(true);

    const text = await downloadFile(selectedFile.path);
    await createNewTodoFile(selectedFile.name, text);
    await linkFile({ ...selectedFile, localFilePath: selectedFile.name });

    handleClose();
  };

  const handleLoadItems = useCallback(
    (path = root) => {
      listFiles({ path }).then((result) => {
        if (result) {
          setFiles(result);
        }
      });
    },
    [listFiles]
  );

  const handleLoadMoreItems = useCallback(
    (path = root) => {
      if (files && files.hasMore && files.cursor) {
        listFiles({ path, cursor: files.cursor }).then((result) => {
          if (result) {
            result.items = [...files.items, ...result.items];
            setFiles(result);
          }
        });
      }
    },
    [files, listFiles]
  );

  const disableItem = useCallback(
    (cloudFile: CloudFile) => {
      return cloudFileRefs.some((c) => c.path === cloudFile.path);
    },
    [cloudFileRefs]
  );

  useEffect(() => {
    if (cloudStorageFileDialogOpen) {
      handleLoadItems(root);
      getCloudFileRefs().then(setCloudFileRefs);
    }
  }, [handleLoadItems, cloudStorageFileDialogOpen, getCloudFileRefs]);

  return (
    <ResponsiveDialog
      maxWidth="xs"
      scroll="paper"
      open={cloudStorageFileDialogOpen}
      onClose={handleClose}
    >
      <DialogTitle sx={{ px: 2 }}>
        {t(`Choose from ${cloudStorage}`)}
      </DialogTitle>
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
              .filter((i) => !i.directory)
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
              <ListItem button onClick={handleLoadMoreItems}>
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

export default CloudStorageFileDialog;
