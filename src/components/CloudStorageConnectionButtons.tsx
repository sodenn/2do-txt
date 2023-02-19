import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { LoadingButton } from "@mui/lab";
import { Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  useCloudStorage,
} from "../stores/CloudStorageContext";

interface CloudStorageConnectionButtonsProps {
  status?: "connect" | "disconnect";
  onMenuItemClick?: (cloudStorage: CloudStorage) => void;
}

export const CloudStorageConnectionButtons = ({
  status,
  onMenuItemClick,
}: CloudStorageConnectionButtonsProps) => {
  const {
    cloudStorageEnabled,
    cloudStoragesConnectionStatus,
    authenticate,
    unlinkCloudStorage,
  } = useCloudStorage();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const filteredCloudStorages = Object.entries(cloudStoragesConnectionStatus)
    .filter(([, connected]) => {
      return typeof status === "undefined"
        ? true
        : status === "connect"
        ? !connected
        : connected;
    })
    .map(([cloudStorages]) => cloudStorages as CloudStorage);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (cloudStorage: CloudStorage) => {
    handleClose();
    const connected = cloudStoragesConnectionStatus[cloudStorage];
    if (!connected) {
      setLoading(true);
      authenticate(cloudStorage).finally(() => setLoading(false));
    } else {
      unlinkCloudStorage(cloudStorage);
    }
    onMenuItemClick?.(cloudStorage);
  };

  if (!cloudStorageEnabled || filteredCloudStorages.length === 0) {
    return null;
  }

  if (filteredCloudStorages.length === 1) {
    const cloudStorage = filteredCloudStorages[0];
    return (
      <LoadingButton
        aria-label="Connect to cloud storage"
        loading={loading}
        variant="outlined"
        startIcon={cloudStorageIcons[cloudStorage]}
        fullWidth
        onClick={() => handleItemClick(cloudStorage)}
      >
        {cloudStoragesConnectionStatus[cloudStorage]
          ? t("Disconnect from cloud storage", { cloudStorage })
          : t("Connect to cloud storage", { cloudStorage })}
      </LoadingButton>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        fullWidth
        onClick={handleClick}
        aria-label="Connect to cloud storage"
        startIcon={<CloudOutlinedIcon />}
        endIcon={<KeyboardArrowDownIcon />}
      >
        {status === "connect"
          ? t("Connect to cloud storage", { cloudStorage: t("cloud storage") })
          : t("Connection")}
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
        {filteredCloudStorages.map((cloudStorage) => (
          <MenuItem
            key={cloudStorage}
            onClick={() => handleItemClick(cloudStorage)}
          >
            <ListItemIcon>{cloudStorageIcons[cloudStorage]}</ListItemIcon>
            {cloudStoragesConnectionStatus[cloudStorage]
              ? t("Disconnect from cloud storage", { cloudStorage })
              : t("Connect to cloud storage", { cloudStorage })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CloudStorageConnectionButtons;
