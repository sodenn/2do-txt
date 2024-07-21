import { ArchiveModeSelect } from "@/components/ArchiveModeSelect";
import { CloudStorageConnectionButtons } from "@/components/CloudStorageConnectionButtons";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PriorityTransformationSelect } from "@/components/PriorityTransformationSelect";
import { TaskViewSelect } from "@/components/TaskViewSelect";
import { ThemeModeSelect } from "@/components/ThemeModeSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/settings-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useCloudStorage } from "@/utils/CloudStorage";
import { useNotification } from "@/utils/useNotification";
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
    <div className="space-y-3 text-sm">
      <ThemeModeSelect />
      <TaskViewSelect />
      <LanguageSelect />
      <div className="space-y-2">
        <div className="font-semibold">{t("Dates")}</div>
        <div className="space-y-2" id="dates">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createCreationDate"
              checked={createCreationDate}
              onCheckedChange={() => toggleCreateCreationDate()}
            />
            <Label htmlFor="createCreationDate">{t("Set creation date")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createCompletionDate"
              checked={createCompletionDate}
              onCheckedChange={() => toggleCreateCompletionDate()}
            />
            <Label htmlFor="createCompletionDate">
              {t("Set completion date")}
            </Label>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="font-semibold">{t("Notifications")}</div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="createCompletionDate"
            checked={showNotifications}
            onCheckedChange={() => handleShowNotifications()}
          />
          <Label htmlFor="createCompletionDate">{t("Due tasks")}</Label>
        </div>
      </div>
      <ArchiveModeSelect />
      <PriorityTransformationSelect />
      {cloudStorageEnabled && (
        <div className="space-y-2">
          <div className="font-semibold">{t("Cloud storage")}</div>
          <CloudStorageConnectionButtons
            onMenuItemClick={() => closeSideSheet()}
          />
        </div>
      )}
    </div>
  );
}
