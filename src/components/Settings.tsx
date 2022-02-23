import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useSettings } from "../data/SettingsContext";
import { useSideSheet } from "../data/SideSheetContext";
import { useNotifications } from "../utils/notifications";
import CloudStorageButton from "./CloudStorageButton";
import LanguageSelect from "./LanguageSelect";
import ThemeModeSelect from "./ThemeModeSelect";

const Settings = () => {
  const { t } = useTranslation();
  const { setSideSheetOpen } = useSideSheet();
  const { cloudStorageEnabled } = useCloudStorage();
  const { checkNotificationPermissions, requestNotificationPermissions } =
    useNotifications();
  const {
    showNotifications,
    setShowNotifications,
    createCompletionDate,
    createCreationDate,
    toggleCreateCompletionDate,
    toggleCreateCreationDate,
  } = useSettings();

  const handleShowNotifications = async () => {
    const currentState = await checkNotificationPermissions();
    if (!showNotifications && currentState.display !== "granted") {
      const response = await requestNotificationPermissions();
      setShowNotifications(response.display === "granted");
    } else {
      setShowNotifications(!showNotifications);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1" gutterBottom>
          {t("Appearance")}
        </Typography>
        <ThemeModeSelect />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1" gutterBottom>
          {t("Language")}
        </Typography>
        <LanguageSelect />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1">
          {t("Dates")}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={createCreationDate}
              onChange={() => toggleCreateCreationDate()}
            />
          }
          label={t("Set creation date") as string}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={createCompletionDate}
              onChange={() => toggleCreateCompletionDate()}
            />
          }
          label={t("Set completion date") as string}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1">
          {t("Notifications")}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={showNotifications}
              onChange={() => handleShowNotifications()}
            />
          }
          label={t("Due tasks") as string}
        />
      </Box>
      {cloudStorageEnabled && (
        <Box sx={{ mb: 2 }}>
          <Typography component="div" variant="subtitle1">
            {t("Cloud storage")}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <CloudStorageButton cloudStorage="Dropbox" />
          </Box>
        </Box>
      )}
    </>
  );
};

export default Settings;
