import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  cloudStorageIcons,
  useCloudFileDialog,
  useCloudStorage,
} from "../data/CloudStorageContext";
import SplitButton, { SplitButtonItem } from "./SplitButton";

const CloudFileImportButtons = () => {
  const { t } = useTranslation();
  const { setCloudFileDialogOptions } = useCloudFileDialog();
  const { cloudStorageEnabled, connectedCloudStorages } = useCloudStorage();

  if (!cloudStorageEnabled || connectedCloudStorages.length === 0) {
    return null;
  }

  if (connectedCloudStorages.length === 1) {
    const cloudStorage = connectedCloudStorages[0];
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
  }

  return (
    <SplitButton aria-label={`Import todo.txt from cloud storage`}>
      {connectedCloudStorages.map((cloudStorage) => (
        <SplitButtonItem
          key={cloudStorage}
          label={t("Import from cloud storage", { cloudStorage })}
          icon={cloudStorageIcons[cloudStorage]}
          onClick={() =>
            setCloudFileDialogOptions({ open: true, cloudStorage })
          }
        />
      ))}
    </SplitButton>
  );
};

export default CloudFileImportButtons;
