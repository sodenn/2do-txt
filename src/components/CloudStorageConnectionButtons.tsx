import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudStorage } from "../data/CloudStorageContext/cloud-storage.types";
import {
  cloudStorageIcons,
  cloudStorages,
  useCloudStorage,
} from "../data/CloudStorageContext/CloudStorageContext";
import SplitButton, { SplitButtonItem } from "./SplitButton";

interface CloudStorageConnectionButtonsProps {
  status: "connect" | "disconnect";
}

export const CloudStorageConnectionButtons = ({
  status,
}: CloudStorageConnectionButtonsProps) => {
  const {
    cloudStorageEnabled,
    cloudStorageClients,
    authenticate,
    disconnectCloudStorage,
  } = useCloudStorage();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const filteredCloudStorages = cloudStorages.filter((cloudStorage) => {
    const client = cloudStorageClients[cloudStorage];
    return status === "connect"
      ? client.status === "disconnected"
      : client.status === "connected";
  });

  const handleClick = async (cloudStorage: CloudStorage) => {
    if (status === "connect") {
      setLoading(true);
      authenticate(cloudStorage).finally(() => setLoading(false));
    } else {
      disconnectCloudStorage(cloudStorage);
    }
  };

  if (!cloudStorageEnabled || filteredCloudStorages.length === 0) {
    return null;
  }

  if (filteredCloudStorages.length === 1) {
    const cloudStorage = filteredCloudStorages[0];
    return (
      <LoadingButton
        loading={status === "connect" ? loading : undefined}
        variant="outlined"
        startIcon={cloudStorageIcons[cloudStorage]}
        fullWidth
        onClick={() => handleClick(cloudStorage)}
      >
        {status === "connect"
          ? t("Connect to cloud storage", { cloudStorage })
          : t("Disconnect from cloud storage", { cloudStorage })}
      </LoadingButton>
    );
  }

  return (
    <SplitButton
      loading={status === "connect" ? loading : undefined}
      aria-label={status === "connect" ? "Connect" : "Disconnect"}
    >
      {filteredCloudStorages.map((cloudStorage) => (
        <SplitButtonItem
          key={cloudStorage}
          label={
            status === "connect"
              ? t("Connect to cloud storage", { cloudStorage })
              : t("Disconnect from cloud storage", { cloudStorage })
          }
          icon={cloudStorageIcons[cloudStorage]}
          onClick={() => handleClick(cloudStorage)}
        />
      ))}
    </SplitButton>
  );
};

export default CloudStorageConnectionButtons;
