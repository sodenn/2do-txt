import { useCloudFileDialogStore } from "@/stores/cloud-file-dialog-store";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { usePlatformStore } from "@/stores/platform-store";
import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import { useDialogButtonSize } from "@/utils/useDialogButtonSize";
import { useFilePicker } from "@/utils/useFilePicker";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import {
  Button,
  Dropdown,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
import React from "react";
import { useTranslation } from "react-i18next";

export function FileActionButton() {
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { openFileDialog } = useFilePicker();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { cloudStorages } = useCloudStorage();
  const openCloudFileDialog = useCloudFileDialogStore(
    (state) => state.openCloudFileDialog,
  );
  const buttonSize = useDialogButtonSize();

  const handleCreateFile = () => {
    openFileCreateDialog();
    closeFileManagementDialog();
  };

  const handleOpenFile = () => {
    openFileDialog();
    closeFileManagementDialog();
  };

  const handleImportFromStorage = (provider: Provider) => {
    openCloudFileDialog(provider);
    closeFileManagementDialog();
  };

  const renderCloudStorageIcon = (provider: Provider) => {
    const icon = cloudStorageIcons[provider];
    return React.isValidElement<{ fontSize?: string }>(icon)
      ? React.cloneElement(icon, {
          fontSize: "small",
        })
      : icon;
  };

  if (cloudStorages.length === 0) {
    return (
      <>
        <Button size={buttonSize} onClick={handleOpenFile}>
          {platform === "desktop" ? t("Open") : t("Import")}
        </Button>
        <Button size={buttonSize} onClick={handleCreateFile}>
          {t("Create")}
        </Button>
      </>
    );
  }

  return (
    <Dropdown>
      <MenuButton
        color="primary"
        variant="solid"
        size={buttonSize}
        aria-label="Choose action"
        endDecorator={<ArrowDropDown />}
      >
        {t("Choose action")}
      </MenuButton>
      <Menu placement="bottom-end">
        <MenuItem onClick={handleCreateFile}>
          <ListItemDecorator>
            <AddOutlinedIcon />
          </ListItemDecorator>
          {t("Create")}
        </MenuItem>
        <MenuItem onClick={handleOpenFile}>
          <ListItemDecorator>
            <FolderOpenOutlinedIcon />
          </ListItemDecorator>
          {platform === "desktop" ? t("Open") : t("Import")}
        </MenuItem>
        {cloudStorages
          .map((s) => s.provider)
          .map((provider) => (
            <MenuItem
              key={provider}
              onClick={() => handleImportFromStorage(provider)}
            >
              <ListItemDecorator>
                {renderCloudStorageIcon(provider)}
              </ListItemDecorator>
              {t("Cloud storage")}
            </MenuItem>
          ))}
      </Menu>
    </Dropdown>
  );
}
