import { Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  cloudStorages,
  useCloudStorage,
} from "../data/CloudStorageContext";

interface CloudFileImportButtonProps {
  cloudStorage: CloudStorage;
}

const CloudFileImportButtons = () => {
  const { cloudStorageEnabled, connectedCloudStorages } = useCloudStorage();

  if (
    !cloudStorageEnabled ||
    cloudStorages.every((cloudStorage) => !connectedCloudStorages[cloudStorage])
  ) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {cloudStorages
        .filter((cloudStorage) => connectedCloudStorages[cloudStorage])
        .map((cloudStorage, idx) => (
          <CloudFileImportButton key={idx} cloudStorage={cloudStorage} />
        ))}
    </Stack>
  );
};

const CloudFileImportButton = ({
  cloudStorage,
}: CloudFileImportButtonProps) => {
  const { t } = useTranslation();
  const { setCloudFileDialogOptions } = useCloudStorage();

  return (
    <Button
      aria-label={`Import todo.txt from ${cloudStorage}`}
      onClick={() => setCloudFileDialogOptions({ open: true, cloudStorage })}
      startIcon={cloudStorageIcons[cloudStorage]}
      variant="outlined"
    >
      {t("Import from cloud storage", { cloudStorage })}
    </Button>
  );
};

export default CloudFileImportButtons;
