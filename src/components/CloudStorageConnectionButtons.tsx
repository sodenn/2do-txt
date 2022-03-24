import { Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  cloudStorageIcons,
  useCloudStorage,
} from "../data/CloudStorageContext";
import { CloudStorage, cloudStorages } from "../types/cloud-storage.types";

interface CloudStorageConnectionButtonsProps {
  connect?: boolean;
  disconnect?: boolean;
}

interface CloudStorageConnectionButtonProps
  extends CloudStorageConnectionButtonsProps {
  cloudStorage: CloudStorage;
}

const CloudStorageConnectionButtons = (
  props: CloudStorageConnectionButtonsProps
) => {
  const { cloudStorageEnabled } = useCloudStorage();

  if (!cloudStorageEnabled) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {cloudStorages.map((cloudStorage, idx) => (
        <CloudStorageConnectionButton
          key={idx}
          {...props}
          cloudStorage={cloudStorage}
        />
      ))}
    </Stack>
  );
};

const CloudStorageConnectionButton = (
  props: CloudStorageConnectionButtonProps
) => {
  const { cloudStorage, connect = true, disconnect = true } = props;
  const { t } = useTranslation();
  const { connectedCloudStorages, authenticate, unlink } = useCloudStorage();

  const cloudStorageConnected = connectedCloudStorages[cloudStorage];

  if (disconnect && cloudStorageConnected) {
    return (
      <Button
        variant="outlined"
        startIcon={cloudStorageIcons[cloudStorage]}
        fullWidth
        onClick={() => unlink(cloudStorage)}
      >
        {t("Disconnect from cloud storage", { cloudStorage })}
      </Button>
    );
  }

  if (connect && !cloudStorageConnected) {
    return (
      <Button
        variant="outlined"
        startIcon={cloudStorageIcons[cloudStorage]}
        fullWidth
        onClick={() => authenticate(cloudStorage)}
      >
        {t("Connect to cloud storage", { cloudStorage })}
      </Button>
    );
  }

  return null;
};

export default CloudStorageConnectionButtons;
