import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useSettings } from "../data/SettingsContext";
import { useNotifications } from "../utils/notifications";
import ArchivalModeSelect from "./ArchivalModeSelect";
import ArchiveNowButton from "./ArchiveNowButton";
import CloudStorageConnectionButtons from "./CloudStorageConnectionButtons";
import LanguageSelect from "./LanguageSelect";
import ThemeModeSelect from "./ThemeModeSelect";

const Settings = () => {
  const { t } = useTranslation();
  const { cloudStorageEnabled } = useCloudStorage();
  const { checkNotificationPermissions, requestNotificationPermissions } =
    useNotifications();
  const {
    showNotifications,
    setShowNotifications,
    createCompletionDate,
    createCreationDate,
    archivalMode,
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
    <Stack spacing={2}>
      <div>
        <Typography component="div" variant="subtitle1" gutterBottom>
          {t("Appearance")}
        </Typography>
        <ThemeModeSelect />
      </div>
      <div>
        <Typography component="div" variant="subtitle1" gutterBottom>
          {t("Language")}
        </Typography>
        <LanguageSelect />
      </div>
      <div>
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
      </div>
      <div>
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
      </div>
      <div>
        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ mb: "0.35em" }}
        >
          <Typography component="div" variant="subtitle1">
            {t("Task Archiving")}
          </Typography>
          <Tooltip
            title={
              <Trans i18nKey="Completed tasks are archived in a second file called done.txt" />
            }
          >
            <HelpOutlineIcon />
          </Tooltip>
        </Stack>
        <Stack spacing={1}>
          <ArchivalModeSelect />
          {archivalMode === "manual" && <ArchiveNowButton />}
        </Stack>
      </div>
      {cloudStorageEnabled && (
        <div>
          <Typography component="div" variant="subtitle1">
            {t("Cloud storage")}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <CloudStorageConnectionButtons />
          </Box>
        </div>
      )}
    </Stack>
  );
};

export default Settings;
