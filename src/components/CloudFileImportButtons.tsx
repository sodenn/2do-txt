import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  useCloudFileDialog,
  useCloudStorage,
} from "../stores/CloudStorageContext";

const CloudFileImportButtons = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { setCloudFileDialogOptions } = useCloudFileDialog();
  const { cloudStorageEnabled, connectedCloudStorages } = useCloudStorage();
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (cloudStorage: CloudStorage) => {
    handleClose();
    setCloudFileDialogOptions({ open: true, cloudStorage });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
    <>
      <Button
        variant="outlined"
        fullWidth
        onClick={handleClick}
        aria-label="Import todo.txt from cloud storage"
        startIcon={<CloudOutlinedIcon />}
        endIcon={<KeyboardArrowDownIcon />}
      >
        {t("Import from cloud storage", { cloudStorage: t("cloud storage") })}
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
        {connectedCloudStorages.map((cloudStorage) => (
          <MenuItem
            key={cloudStorage}
            onClick={() => handleMenuItemClick(cloudStorage)}
          >
            <ListItemIcon>{cloudStorageIcons[cloudStorage]}</ListItemIcon>
            {t("Import from cloud storage", { cloudStorage })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CloudFileImportButtons;
