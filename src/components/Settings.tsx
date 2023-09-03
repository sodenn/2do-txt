import { ArchiveModeSelect } from "@/components/ArchiveModeSelect";
import { ArchiveNowButton } from "@/components/ArchiveNowButton";
import { CloudStorageConnectionButtons } from "@/components/CloudStorageConnectionButtons";
import { Heading } from "@/components/Heading";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PriorityTransformationSelect } from "@/components/PriorityTransformationSelect";
import { TaskViewSelect } from "@/components/TaskViewSelect";
import { ThemeModeSelect } from "@/components/ThemeModeSelect";
import { useSettingsStore } from "@/stores/settings-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useCloudStorage } from "@/utils/CloudStorage";
import { useNotification } from "@/utils/useNotification";
import { Checkbox, Stack } from "@mui/joy";
import { Trans, useTranslation } from "react-i18next";

export function Settings() {
  const { t } = useTranslation();
  const { cloudStorageEnabled } = useCloudStorage();
  const closeSideSheet = useSideSheetStore((state) => state.closeSideSheet);
  const { isNotificationPermissionGranted, requestNotificationPermission } =
    useNotification();
  const showNotifications = useSettingsStore(
    (state) => state.showNotifications,
  );
  const setShowNotifications = useSettingsStore(
    (state) => state.setShowNotifications,
  );
  const createCompletionDate = useSettingsStore(
    (state) => state.createCompletionDate,
  );
  const createCreationDate = useSettingsStore(
    (state) => state.createCreationDate,
  );
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const toggleCreateCompletionDate = useSettingsStore(
    (state) => state.toggleCreateCompletionDate,
  );
  const toggleCreateCreationDate = useSettingsStore(
    (state) => state.toggleCreateCreationDate,
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
      <Stack spacing={1}>
        <Heading>{t("Dates")}</Heading>
        <Checkbox
          checked={createCreationDate}
          label={t("Set creation date")}
          onChange={() => toggleCreateCreationDate()}
        />
        <Checkbox
          checked={createCompletionDate}
          label={t("Set completion date")}
          onChange={() => toggleCreateCompletionDate()}
        />
      </Stack>
      <Stack spacing={1}>
        <Heading>{t("Notifications")}</Heading>
        <Checkbox
          checked={showNotifications}
          label={t("Due tasks")}
          onChange={() => handleShowNotifications()}
        />
      </Stack>
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
}
