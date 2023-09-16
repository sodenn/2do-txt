import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import CloudIcon from "@mui/icons-material/Cloud";
import {
  Button,
  Dropdown,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const filteredProviders = providers.filter((provider) => {
    const connected = cloudStorages.some((s) => s.provider === provider);
    return typeof status === "undefined"
      ? true
      : status === "connect"
      ? !connected
      : connected;
  });

  const handleItemClick = async (provider: Provider) => {
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
      <Button
        aria-label="Connect to cloud storage"
        loading={loading}
        color="neutral"
        variant="outlined"
        startDecorator={cloudStorageIcons[provider]}
        onClick={() => handleItemClick(provider)}
      >
        {cloudStorages.some((s) => s.provider === provider)
          ? t("Disconnect from cloud storage", { provider })
          : t("Connect to cloud storage", { provider })}
      </Button>
    );
  }

  return (
    <Dropdown>
      <MenuButton
        color="neutral"
        variant="outlined"
        aria-label="Connect to cloud storage"
        startDecorator={<CloudIcon />}
        endDecorator={<ArrowDropDown />}
      >
        {status === "connect"
          ? t("Connect to cloud storage", { provider: t("cloud storage") })
          : t("Connection")}
      </MenuButton>
      <Menu sx={{ mt: 0.5 }} placement="bottom-end">
        {filteredProviders.map((provider) => (
          <MenuItem key={provider} onClick={() => handleItemClick(provider)}>
            <ListItemDecorator>{cloudStorageIcons[provider]}</ListItemDecorator>
            {cloudStorages.some((s) => s.provider === provider)
              ? t("Disconnect from cloud storage", { provider })
              : t("Connect to cloud storage", { provider })}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}
