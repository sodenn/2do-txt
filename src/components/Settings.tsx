import { Box, Checkbox, FormControlLabel, Stack } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useSettings } from "../data/SettingsContext";
import { useNotifications } from "../utils/notifications";
import ArchiveModeSelect from "./ArchiveModeSelect";
import ArchiveNowButton from "./ArchiveNowButton";
import CloudStorageConnectionButtons from "./CloudStorageConnectionButtons";
import Heading from "./Heading";
import LanguageSelect from "./LanguageSelect";
import PriorityTransformationSelect from "./PriorityTransformationSelect";
import TaskViewSelect from "./TaskViewSelect";
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
    archiveMode,
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
        <Heading gutterBottom>{t("Appearance")}</Heading>
        <ThemeModeSelect />
      </div>
      <div>
        <Heading gutterBottom>{t("Task view")}</Heading>
        <TaskViewSelect />
      </div>
      <div>
        <Heading gutterBottom>{t("Language")}</Heading>
        <LanguageSelect />
      </div>
      <div>
        <Heading>{t("Dates")}</Heading>
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
        <Heading>{t("Notifications")}</Heading>
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
        <Heading
          gutterBottom
          helperText={
            <Trans i18nKey="Completed tasks are archived in a second file called done.txt" />
          }
        >
          {t("Archiving")}
        </Heading>
        <Stack spacing={1}>
          <ArchiveModeSelect />
          {archiveMode === "manual" && <ArchiveNowButton />}
        </Stack>
      </div>
      <div>
        <Heading gutterBottom>{t("Completed tasks")}</Heading>
        <PriorityTransformationSelect />
      </div>
      {cloudStorageEnabled && (
        <div>
          <Heading gutterBottom>{t("Cloud storage")}</Heading>
          <Box sx={{ mt: 1 }}>
            <CloudStorageConnectionButtons />
          </Box>
        </div>
      )}
    </Stack>
  );
};

export default Settings;
