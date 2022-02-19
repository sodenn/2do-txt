import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useTask } from "../data/TaskContext";
import { CloudFile, ListCloudFilesResult } from "../types/cloud-storage.types";
import StartEllipsis from "./StartEllipsis";

const root = "";

const CloudStorageFileDialog = () => {
  const { t } = useTranslation();
  const { createNewTodoFile } = useTask();
  const {
    listFiles,
    cloudStorage,
    downloadFile,
    setCloudFile,
    cloudStorageFileDialogOpen,
    setCloudStorageFileDialogOpen,
  } = useCloudStorage();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CloudFile | undefined>();
  const [files, setFiles] = useState<ListCloudFilesResult | undefined>();

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
    await setCloudFile({ ...selectedFile, localFilePath: selectedFile.name });

    handleClose();
  };

  const loadItems = useCallback(
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

  useEffect(() => {
    loadItems(root);
  }, [loadItems, cloudStorageFileDialogOpen]);

  return (
    <Dialog open={cloudStorageFileDialogOpen} onClose={handleClose}>
      <DialogTitle sx={{ px: 2 }}>
        {t(`Choose from ${cloudStorage}`)}
      </DialogTitle>
      {files && files.items.length > 0 && (
        <List sx={{ pt: 0 }} dense>
          {files.items
            .filter((i) => !i.directory)
            .map((item, idx) => (
              <ListItem
                button
                key={idx}
                onClick={() => setSelectedFile(item)}
                selected={selectedFile && item.path === selectedFile.path}
              >
                <Box sx={{ overflow: "hidden" }}>
                  <StartEllipsis sx={{ my: 0.5 }}>{item.name}</StartEllipsis>
                  <StartEllipsis
                    sx={{ my: 0.5 }}
                    variant="body2"
                    color="text.secondary"
                  >
                    {item.path}
                  </StartEllipsis>
                </Box>
              </ListItem>
            ))}
          {files.hasMore && (
            <ListItem button onClick={handleLoadMoreItems}>
              <StartEllipsis sx={{ my: 0.5 }}>{t("Load more")}</StartEllipsis>
            </ListItem>
          )}
        </List>
      )}
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
    </Dialog>
  );
};

export default CloudStorageFileDialog;
