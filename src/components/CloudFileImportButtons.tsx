import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { Button, Stack } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { CloudStorage, cloudStorages } from "../types/cloud-storage.types";

interface CloudFileImportButtonProps {
  cloudStorage: CloudStorage;
}

const CloudFileImportButtons = () => {
  const { cloudStorageEnabled } = useCloudStorage();

  if (!cloudStorageEnabled) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {cloudStorages.map((cloudStorage, idx) => (
        <CloudFileImportButton key={idx} cloudStorage={cloudStorage} />
      ))}
    </Stack>
  );
};

const CloudFileImportButton = ({
  cloudStorage,
}: CloudFileImportButtonProps) => {
  const { t } = useTranslation();
  const { setCloudFileDialogOptions, connectedCloudStorages } =
    useCloudStorage();

  if (!connectedCloudStorages[cloudStorage]) {
    return null;
  }

  return (
    <Button
      aria-label={`Import todo.txt from ${cloudStorage}`}
      onClick={() => setCloudFileDialogOptions({ open: true, cloudStorage })}
      startIcon={<CloudOutlinedIcon />}
      variant="outlined"
    >
      {t("Import from cloud storage", { cloudStorage })}
    </Button>
  );
};

export default CloudFileImportButtons;
