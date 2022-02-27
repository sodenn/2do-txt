import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { ListItemIcon, ListItemText, MenuItem, Stack } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { CloudStorage, cloudStorages } from "../types/cloud-storage.types";

interface CloudFileImportMenuItemsProps {
  onClick: () => void;
}

interface CloudFileImportMenuItemProps extends CloudFileImportMenuItemsProps {
  cloudStorage: CloudStorage;
}

const CloudFileImportMenuItems = (props: CloudFileImportMenuItemsProps) => {
  return (
    <Stack spacing={1}>
      {cloudStorages.map((cloudStorage, idx) => (
        <CloudFileImportMenuItem
          key={idx}
          {...props}
          cloudStorage={cloudStorage}
        />
      ))}
    </Stack>
  );
};

const CloudFileImportMenuItem = ({
  cloudStorage,
  onClick,
}: CloudFileImportMenuItemProps) => {
  const { t } = useTranslation();
  const {
    setCloudFileDialogOptions,
    cloudStorageEnabled,
    connectedCloudStorages,
  } = useCloudStorage();

  if (!cloudStorageEnabled || !connectedCloudStorages[cloudStorage]) {
    return null;
  }

  const handleImportFromCloudStorage = () => {
    onClick();
    setCloudFileDialogOptions({ open: true, cloudStorage });
  };

  return (
    <MenuItem onClick={() => handleImportFromCloudStorage()}>
      <ListItemIcon>
        <CloudOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{t("Cloud Storage Import", { cloudStorage })}</ListItemText>
    </MenuItem>
  );
};

export default CloudFileImportMenuItems;
