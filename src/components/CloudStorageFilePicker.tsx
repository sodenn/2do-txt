import { Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext/CloudStorageContext";
import { CloudStorage } from "../types/cloud-storage.types";

interface CloudStorageFileManagerProps {
  onClick: () => void;
  cloudStorage: CloudStorage;
}

const CloudStorageFilePicker = (props: CloudStorageFileManagerProps) => {
  const { onClick, cloudStorage } = props;
  const { t } = useTranslation();
  const {
    cloudStorageEnabled,
    cloudStorageConnected,
    setCloudStorageFileDialogOpen,
  } = useCloudStorage();

  const handleClick = () => {
    onClick();
    setCloudStorageFileDialogOpen(true);
  };

  if (!cloudStorageConnected || !cloudStorageEnabled) {
    return null;
  }

  return (
    <Button variant="outlined" fullWidth onClick={handleClick}>
      {t(`Choose from ${cloudStorage}`)}
    </Button>
  );
};

export default CloudStorageFilePicker;
