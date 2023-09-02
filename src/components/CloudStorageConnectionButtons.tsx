import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { LoadingButton } from "@mui/lab";
import { Button, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface CloudStorageConnectionButtonsProps {
  status?: "connect" | "disconnect";
  onMenuItemClick?: (provider: Provider) => void;
}

const providers: Provider[] = ["Dropbox", "WebDAV"];

export function CloudStorageConnectionButtons({
  status,
  onMenuItemClick,
}: CloudStorageConnectionButtonsProps) {
  const {
    cloudStorageEnabled,
    cloudStorages,
    authenticate,
    removeCloudStorage,
  } = useCloudStorage();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const filteredProviders = providers.filter((provider) => {
    const connected = cloudStorages.some((s) => s.provider === provider);
    return typeof status === "undefined"
      ? true
      : status === "connect"
      ? !connected
      : connected;
  });
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (provider: Provider) => {
    handleClose();
    const connected = cloudStorages.some((s) => s.provider === provider);
    if (!connected) {
      setLoading(true);
      authenticate(provider).finally(() => setLoading(false));
    } else {
      removeCloudStorage(provider);
    }
    onMenuItemClick?.(provider);
  };

  if (!cloudStorageEnabled || filteredProviders.length === 0) {
    return null;
  }

  if (filteredProviders.length === 1) {
    const provider = filteredProviders[0];
    return (
      <LoadingButton
        aria-label="Connect to cloud storage"
        loading={loading}
        variant="outlined"
        startIcon={cloudStorageIcons[provider]}
        fullWidth
        onClick={() => handleItemClick(provider)}
      >
        {cloudStorages.some((s) => s.provider === provider)
          ? t("Disconnect from cloud storage", { provider })
          : t("Connect to cloud storage", { provider })}
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
          ? t("Connect to cloud storage", { provider: t("cloud storage") })
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
        {filteredProviders.map((provider) => (
          <MenuItem key={provider} onClick={() => handleItemClick(provider)}>
            <ListItemIcon>{cloudStorageIcons[provider]}</ListItemIcon>
            {cloudStorages.some((s) => s.provider === provider)
              ? t("Disconnect from cloud storage", { provider })
              : t("Connect to cloud storage", { provider })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
