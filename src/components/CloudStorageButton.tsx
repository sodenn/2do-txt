import { Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { CloudStorage } from "../types/cloud-storage.types";

interface CloudStorageConnectButtonProps {
  cloudStorage: CloudStorage;
  connect?: boolean;
  disconnect?: boolean;
}

const CloudStorageButton = (props: CloudStorageConnectButtonProps) => {
  const { cloudStorage, connect = true, disconnect = true } = props;
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

  if (
    disconnect &&
    cloudStorageConnected &&
    cloudStorage === currentCloudStorage
  ) {
    return (
      <Button variant="outlined" fullWidth onClick={() => unlink()}>
        {t(`Disconnect from ${cloudStorage}`)}
      </Button>
    );
  }

  if (connect && !cloudStorageConnected) {
    return (
      <Button
        variant="outlined"
        fullWidth
        onClick={() => authenticate(cloudStorage)}
      >
        {t(`Connect to ${cloudStorage}`)}
      </Button>
    );
  }

  return null;
};

export default CloudStorageButton;
