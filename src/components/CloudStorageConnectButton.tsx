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
  const {
    cloudStorageEnabled,
    cloudStorageConnected,
    cloudStorage: currentCloudStorage,
    authenticate,
    unlink,
  } = useCloudStorage();

  if (!cloudStorageEnabled) {
    return null;
  }

  if (cloudStorageConnected && cloudStorage === currentCloudStorage) {
    return (
      <Button variant="outlined" fullWidth onClick={() => unlink()}>
        {t(`Disconnect ${cloudStorage}`)}
      </Button>
    );
  }

  if (!cloudStorageConnected) {
    return (
      <Button
        variant="outlined"
        fullWidth
        onClick={() => authenticate(cloudStorage)}
      >
        {t(`Connect ${cloudStorage}`)}
      </Button>
    );
  }

  return null;
};

export default CloudStorageConnectButton;
