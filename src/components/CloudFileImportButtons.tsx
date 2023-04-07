import { Provider } from "@cloudstorage/core";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import useCloudFileDialogStore from "../stores/cloud-file-dialog-store";
import { cloudStorageIcons, useCloudStorage } from "../utils/CloudStorage";

const CloudFileImportButtons = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openCloudFileDialog = useCloudFileDialogStore(
    (state) => state.openCloudFileDialog
  );
  const { cloudStorageEnabled, cloudStorages } = useCloudStorage();
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (provider: Provider) => {
    handleClose();
    openCloudFileDialog(provider);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!cloudStorageEnabled || cloudStorages.length === 0) {
    return null;
  }

  if (cloudStorages.length === 1) {
    const provider = cloudStorages[0].provider;
    return (
      <Button
        aria-label={`Import todo.txt from ${provider}`}
        onClick={() => openCloudFileDialog(provider)}
        startIcon={cloudStorageIcons[provider]}
        variant="outlined"
      >
        {t("Import from cloud storage", { provider })}
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
        {t("Import from cloud storage", { provider: t("cloud storage") })}
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
        {cloudStorages.map(({ provider }) => (
          <MenuItem
            key={provider}
            onClick={() => handleMenuItemClick(provider)}
          >
            <ListItemIcon>{cloudStorageIcons[provider]}</ListItemIcon>
            {t("Import from cloud storage", { provider })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CloudFileImportButtons;
