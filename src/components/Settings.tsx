import { ArchiveModeSelect } from "@/components/ArchiveModeSelect";
import { CloudStorageConnectionButtons } from "@/components/CloudStorageConnectionButtons";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PriorityTransformationSelect } from "@/components/PriorityTransformationSelect";
import { TaskViewSelect } from "@/components/TaskViewSelect";
import { ThemeModeSelect } from "@/components/ThemeModeSelect";
import { useSettingsStore } from "@/stores/settings-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useCloudStorage } from "@/utils/CloudStorage";
import { useNotification } from "@/utils/useNotification";
import { Checkbox, FormControl, FormLabel, Stack } from "@mui/joy";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";

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
      <ThemeModeSelect />
      <TaskViewSelect />
      <LanguageSelect />
      <Box>
        <FormLabel sx={{ mb: "0.375rem" }} component="div">
          {t("Dates")}
        </FormLabel>
        <Stack spacing={1} id="dates">
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
      </Box>
      <FormControl>
        <FormLabel>{t("Notifications")}</FormLabel>
        <Checkbox
          checked={showNotifications}
          label={t("Due tasks")}
          onChange={() => handleShowNotifications()}
        />
      </FormControl>
      <ArchiveModeSelect />
      <PriorityTransformationSelect />
      {cloudStorageEnabled && (
        <FormControl>
          <FormLabel>{t("Cloud storage")}</FormLabel>
          <CloudStorageConnectionButtons
            onMenuItemClick={() => closeSideSheet()}
          />
        </FormControl>
      )}
    </Stack>
  );
}
