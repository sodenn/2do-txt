import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { IconProps } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  useCloudFileDialog,
  useCloudStorage,
} from "../../data/CloudStorageContext";
import { useFileCreateDialog } from "../../data/FileCreateDialogContext";
import { useFileManagementDialog } from "../../data/FileManagementDialogContext";
import { useTask } from "../../data/TaskContext";
import { getPlatform } from "../../utils/platform";
import SplitButton, { SplitButtonItem } from "../SplitButton";

const FileActionButton = () => {
  const { t } = useTranslation();
  const platform = getPlatform();
  const { openTodoFilePicker } = useTask();
  const { setFileCreateDialog } = useFileCreateDialog();
  const { setFileManagementDialogOpen } = useFileManagementDialog();
  const { connectedCloudStorages } = useCloudStorage();
  const { setCloudFileDialogOptions } = useCloudFileDialog();

  const handleCreateFile = () => {
    setFileCreateDialog({ open: true });
    setFileManagementDialogOpen(false);
  };

  const handleOpenFile = () => {
    openTodoFilePicker();
    setFileManagementDialogOpen(false);
  };

  const handleImportFromStorage = (cloudStorage: CloudStorage) => {
    setCloudFileDialogOptions({ open: true, cloudStorage });
    setFileManagementDialogOpen(false);
  };

  const renderCloudStorageIcon = (cloudStorage: CloudStorage) => {
    const icon = cloudStorageIcons[cloudStorage];
    return React.isValidElement<IconProps>(icon)
      ? React.cloneElement(icon, {
          fontSize: "small",
        })
      : icon;
  };

  return (
    <SplitButton>
      <SplitButtonItem
        label={t("Create todo.txt")}
        onClick={handleCreateFile}
        icon={<AddOutlinedIcon fontSize="small" />}
      />
      <SplitButtonItem
        label={
          platform === "electron" ? t("Open todo.txt") : t("Import todo.txt")
        }
        onClick={handleOpenFile}
        icon={<FolderOpenOutlinedIcon fontSize="small" />}
      />
      {connectedCloudStorages.map((cloudStorage) => (
        <SplitButtonItem
          key={cloudStorage}
          label={t("Import from cloud storage", { cloudStorage })}
          onClick={() => handleImportFromStorage(cloudStorage)}
          icon={renderCloudStorageIcon(cloudStorage)}
        />
      ))}
    </SplitButton>
  );
};

export default FileActionButton;
