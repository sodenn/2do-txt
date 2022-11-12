import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
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
    cloudStoragesConnectionStatus,
    authenticate,
    unlinkCloudStorage,
  } = useCloudStorage();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const filteredCloudStorages = Object.entries(cloudStoragesConnectionStatus)
    .filter(([, connected]) => {
      return typeof status === "undefined"
        ? true
        : status === "connect"
        ? !connected
        : connected;
    })
    .map(([cloudStorages]) => cloudStorages as CloudStorage);

  const handleClick = async (cloudStorage: CloudStorage) => {
    const connected = cloudStoragesConnectionStatus[cloudStorage];
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
        {cloudStoragesConnectionStatus[cloudStorage]
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
            cloudStoragesConnectionStatus[cloudStorage]
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
