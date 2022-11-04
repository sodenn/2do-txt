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
  status: "connect" | "disconnect";
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
    return status === "connect" ? !connected : connected;
  });

  const handleClick = async (cloudStorage: CloudStorage) => {
    if (status === "connect") {
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
