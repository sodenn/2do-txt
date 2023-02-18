import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import useSettings from "../data/settings-store";
import useSideSheet from "../data/side-sheet-store";
import { useNotification } from "../utils/notification";
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
  const closeSideSheet = useSideSheet((state) => state.closeSideSheet);
  const { isNotificationPermissionGranted, requestNotificationPermission } =
    useNotification();
  const showNotifications = useSettings((state) => state.showNotifications);
  const setShowNotifications = useSettings(
    (state) => state.setShowNotifications
  );
  const createCompletionDate = useSettings(
    (state) => state.createCompletionDate
  );
  const createCreationDate = useSettings((state) => state.createCreationDate);
  const archiveMode = useSettings((state) => state.archiveMode);
  const toggleCreateCompletionDate = useSettings(
    (state) => state.toggleCreateCompletionDate
  );
  const toggleCreateCreationDate = useSettings(
    (state) => state.toggleCreateCreationDate
  );

  const handleShowNotifications = async () => {
    let granted = await isNotificationPermissionGranted();
    if (!showNotifications && !granted) {
      granted = await requestNotificationPermission();
      setShowNotifications(granted);
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
          label={t("Set creation date")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={createCompletionDate}
              onChange={() => toggleCreateCompletionDate()}
            />
          }
          label={t("Set completion date")}
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
          label={t("Due tasks")}
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
          <Stack sx={{ mt: 1 }} spacing={1}>
            <CloudStorageConnectionButtons
              onMenuItemClick={() => closeSideSheet()}
            />
          </Stack>
        </div>
      )}
    </Stack>
  );
};

export default Settings;
