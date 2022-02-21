import { Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { CloudStorage } from "../types/cloud-storage.types";

interface CloudStorageConnectButtonProps {
  cloudStorage: CloudStorage;
}

const CloudStorageConnectButton = (props: CloudStorageConnectButtonProps) => {
  const { cloudStorage } = props;
  const { t } = useTranslation();
  const { cloudStorageEnabled, cloudStorageConnected, authenticate } =
    useCloudStorage();

  if (!cloudStorageEnabled || cloudStorageConnected) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      fullWidth
      onClick={() => authenticate(cloudStorage)}
    >
      {t(`Connect ${cloudStorage}`)}
    </Button>
  );
};

export default CloudStorageConnectButton;
