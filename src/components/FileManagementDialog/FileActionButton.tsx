import { useCloudFileDialogStore } from "@/stores/cloud-file-dialog-store";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { usePlatformStore } from "@/stores/platform-store";
import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import { useFilePicker } from "@/utils/useFilePicker";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, IconProps, ListItemIcon, Menu, MenuItem } from "@mui/material";
import React, { MouseEvent, useState } from "react";
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
    return React.isValidElement<IconProps>(icon)
      ? React.cloneElement(icon, {
          fontSize: "small",
        })
      : icon;
  };

  if (cloudStorages.length === 0) {
    return (
      <>
        <Button onClick={handleCreateFile}>{t("Create todo.txt")}</Button>
        <Button onClick={handleOpenFile}>
          {platform === "desktop" ? t("Open todo.txt") : t("Import todo.txt")}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        aria-label="Choose action"
        endIcon={<KeyboardArrowDownIcon />}
      >
        {t("Choose action")}
      </Button>
      <Menu
        sx={{ mt: 0.5 }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleCreateFile}>
          <ListItemIcon>
            <AddOutlinedIcon />
          </ListItemIcon>
          {t("Create todo.txt")}
        </MenuItem>
        <MenuItem onClick={handleOpenFile}>
          <ListItemIcon>
            <FolderOpenOutlinedIcon />
          </ListItemIcon>
          {platform === "desktop" ? t("Open todo.txt") : t("Import todo.txt")}
        </MenuItem>
        {cloudStorages
          .map((s) => s.provider)
          .map((provider) => (
            <MenuItem
              key={provider}
              onClick={() => handleImportFromStorage(provider)}
            >
              <ListItemIcon>{renderCloudStorageIcon(provider)}</ListItemIcon>
              {t("Import from cloud storage", { provider })}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}
