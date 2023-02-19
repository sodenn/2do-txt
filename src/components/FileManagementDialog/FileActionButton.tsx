import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, IconProps, ListItemIcon, Menu, MenuItem } from "@mui/material";
import React, { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  useCloudFileDialog,
  useCloudStorage,
} from "../../stores/CloudStorageContext";
import useFileCreateDialog from "../../stores/file-create-dialog-store";
import useFileManagementDialog from "../../stores/file-management-dialog-store";
import useFilePicker from "../../stores/file-picker-store";
import { getPlatform } from "../../utils/platform";

const FileActionButton = () => {
  const { t } = useTranslation();
  const platform = getPlatform();
  const { openFileDialog } = useFilePicker();
  const openFileCreateDialog = useFileCreateDialog(
    (state) => state.openFileCreateDialog
  );
  const closeFileManagementDialog = useFileManagementDialog(
    (state) => state.closeFileManagementDialog
  );
  const { connectedCloudStorages } = useCloudStorage();
  const { setCloudFileDialogOptions } = useCloudFileDialog();
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

  const handleImportFromStorage = (cloudStorage: CloudStorage) => {
    setCloudFileDialogOptions({ open: true, cloudStorage });
    closeFileManagementDialog();
  };

  const renderCloudStorageIcon = (cloudStorage: CloudStorage) => {
    const icon = cloudStorageIcons[cloudStorage];
    return React.isValidElement<IconProps>(icon)
      ? React.cloneElement(icon, {
          fontSize: "small",
        })
      : icon;
  };

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
        {connectedCloudStorages.map((cloudStorage) => (
          <MenuItem
            key={cloudStorage}
            onClick={() => handleImportFromStorage(cloudStorage)}
          >
            <ListItemIcon>{renderCloudStorageIcon(cloudStorage)}</ListItemIcon>
            {t("Import from cloud storage", { cloudStorage })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FileActionButton;
