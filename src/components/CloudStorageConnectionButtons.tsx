import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import { ChevronsUpDownIcon, CloudIcon } from "lucide-react";
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
        variant="outline"
        onClick={() => handleItemClick(provider)}
      >
        {cloudStorageIcons[provider]}
        {cloudStorages.some((s) => s.provider === provider)
          ? t("Disconnect from cloud storage", { provider })
          : t("Connect to cloud storage", { provider })}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          tabIndex={0}
          variant="outline"
          className="w-full justify-start"
          aria-label="Connect to cloud storage"
        >
          <CloudIcon className="mr-2 h-4 w-4" />
          {status === "connect"
            ? t("Connect to cloud storage", { provider: t("cloud storage") })
            : t("Connection")}
          <div className="flex-1" />
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {filteredProviders.map((provider) => (
          <DropdownMenuItem
            key={provider}
            onClick={() => handleItemClick(provider)}
          >
            {cloudStorageIcons[provider]}
            {cloudStorages.some((s) => s.provider === provider)
              ? t("Disconnect from cloud storage", { provider })
              : t("Connect to cloud storage", { provider })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
