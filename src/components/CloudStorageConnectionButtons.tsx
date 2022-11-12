import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  cloudStorages,
  useCloudStorage,
} from "../data/CloudStorageContext";
import SplitButton, { SplitButtonItem } from "./SplitButton";

interface CloudStorageConnectionButtonsProps {
  status?: "connect" | "disconnect";
}

export const CloudStorageConnectionButtons = ({
  status,
}: CloudStorageConnectionButtonsProps) => {
  const {
    cloudStorageEnabled,
    connectedCloudStorages,
    authenticate,
    unlinkCloudStorage,
  } = useCloudStorage();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const filteredCloudStorages = cloudStorages.filter((cloudStorage) => {
    const connected = connectedCloudStorages[cloudStorage];
    return typeof status === "undefined"
      ? true
      : status === "connect"
      ? !connected
      : connected;
  });

  const handleClick = async (cloudStorage: CloudStorage) => {
    const connected = connectedCloudStorages[cloudStorage];
    if (!connected) {
      setLoading(true);
      authenticate(cloudStorage).finally(() => setLoading(false));
    } else {
      unlinkCloudStorage(cloudStorage);
    }
  };

  if (!cloudStorageEnabled || filteredCloudStorages.length === 0) {
    return null;
  }

  if (filteredCloudStorages.length === 1) {
    const cloudStorage = filteredCloudStorages[0];
    return (
      <LoadingButton
        loading={loading}
        variant="outlined"
        startIcon={cloudStorageIcons[cloudStorage]}
        fullWidth
        onClick={() => handleClick(cloudStorage)}
      >
        {connectedCloudStorages[cloudStorage]
          ? t("Disconnect from cloud storage", { cloudStorage })
          : t("Connect to cloud storage", { cloudStorage })}
      </LoadingButton>
    );
  }

  return (
    <SplitButton loading={loading}>
      {filteredCloudStorages.map((cloudStorage) => (
        <SplitButtonItem
          key={cloudStorage}
          label={
            connectedCloudStorages[cloudStorage]
              ? t("Disconnect from cloud storage", { cloudStorage })
              : t("Connect to cloud storage", { cloudStorage })
          }
          icon={cloudStorageIcons[cloudStorage]}
          onClick={() => handleClick(cloudStorage)}
        />
      ))}
    </SplitButton>
  );
};

export default CloudStorageConnectionButtons;
