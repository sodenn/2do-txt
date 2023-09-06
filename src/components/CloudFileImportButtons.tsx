import { useCloudFileDialogStore } from "@/stores/cloud-file-dialog-store";
import {
  Provider,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Button,
  Dropdown,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
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
        startDecorator={cloudStorageIcons[provider]}
        variant="outlined"
      >
        {t("Import from cloud storage", { provider })}
      </Button>
    );
  }

  return (
    <Dropdown>
      <MenuButton
        color="neutral"
        variant="outlined"
        aria-label="Import todo.txt from cloud storage"
        startDecorator={<CloudOutlinedIcon />}
        endDecorator={<KeyboardArrowDownIcon />}
      >
        {t("Import from cloud storage", { provider: t("cloud storage") })}
      </MenuButton>
      <Menu placement="bottom-end">
        {cloudStorages.map(({ provider }) => (
          <MenuItem
            key={provider}
            onClick={() => handleMenuItemClick(provider)}
          >
            <ListItemDecorator>{cloudStorageIcons[provider]}</ListItemDecorator>{" "}
            {t("Import from cloud storage", { provider })}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}
