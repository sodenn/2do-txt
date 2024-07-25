import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCloudFileDialogStore } from "@/stores/cloud-file-dialog-store";
import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import { ChevronsUpDownIcon, CloudIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CloudFileImportButtons() {
  const { t } = useTranslation();
  const openCloudFileDialog = useCloudFileDialogStore(
    (state) => state.openCloudFileDialog,
  );
  const { cloudStorageEnabled, cloudStorages } = useCloudStorage();

  const handleMenuItemClick = (provider: Provider) => {
    openCloudFileDialog(provider);
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
        variant="outline"
      >
        {cloudStorageIcons[provider]}
        {t("Import from cloud storage", { provider })}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          tabIndex={0}
          variant="outline"
          aria-label="Import todo.txt from cloud storage"
        >
          <CloudIcon className="mr-2 h-4 w-4" />
          {t("Import from cloud storage", { provider: t("cloud storage") })}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {cloudStorages.map(({ provider }) => (
          <DropdownMenuItem
            key={provider}
            onClick={() => handleMenuItemClick(provider)}
          >
            {cloudStorageIcons[provider]}
            {t("Import from cloud storage", { provider })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
