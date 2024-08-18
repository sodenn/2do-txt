import { ArchiveModeSelect } from "@/components/ArchiveModeSelect";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PriorityTransformationSelect } from "@/components/PriorityTransformationSelect";
import { ReminderSelect } from "@/components/ReminderSelect";
import { TaskViewSelect } from "@/components/TaskViewSelect";
import { ThemeModeSelect } from "@/components/ThemeModeSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/settings-store";
import { useTranslation } from "react-i18next";

export function Settings() {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-3 text-sm">
      <fieldset className="rounded-lg border p-4">
        <legend className="-ml-1 px-1 text-sm font-medium">
          {t("Display Settings")}
        </legend>
        <div className="space-y-4">
          <ThemeModeSelect />
          <TaskViewSelect />
          <LanguageSelect />
        </div>
      </fieldset>
      <fieldset className="rounded-lg border p-4">
        <legend className="-ml-1 px-1 text-sm font-medium">{t("Tasks")}</legend>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createCreationDate"
                checked={createCreationDate}
                onCheckedChange={() => toggleCreateCreationDate()}
              />
              <Label htmlFor="createCreationDate">
                {t("Set creation date")}
              </Label>
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
          <ArchiveModeSelect />
          <PriorityTransformationSelect />
        </div>
      </fieldset>
      <fieldset className="rounded-lg border p-4">
        <legend className="-ml-1 px-1 text-sm font-medium">
          {t("Notifications")}
        </legend>
        <ReminderSelect />
      </fieldset>
    </div>
  );
}
