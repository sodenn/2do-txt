import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";
import { useNotification } from "@/utils/useNotification";
import { useTranslation } from "react-i18next";

const oneHour = 1000 * 60 * 60;

const reminders = [
  oneHour * 4, // 4h
  oneHour * 8, // 8h
  oneHour * 16, // 12h
];

export function ReminderSelect() {
  const { t } = useTranslation();
  const { isNotificationPermissionGranted, requestNotificationPermission } =
    useNotification();
  const showNotifications = useSettingsStore(
    (state) => state.showNotifications,
  );
  const setShowNotifications = useSettingsStore(
    (state) => state.setShowNotifications,
  );
  const reminderOffset = useSettingsStore((store) => store.reminderOffset);
  const setReminderOffset = useSettingsStore(
    (store) => store.setReminderOffset,
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
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enableDueDateNotifications"
          checked={showNotifications}
          onCheckedChange={() => handleShowNotifications()}
        />
        <Label htmlFor="enableDueDateNotifications">
          {t("Receive notifications")}
        </Label>
      </div>
      <div className="flex flex-col-reverse gap-2">
        <Select
          disabled={!showNotifications}
          value={reminderOffset.toString()}
          onValueChange={(value) => setReminderOffset(parseInt(value))}
        >
          <SelectTrigger
            className="peer"
            id="reminderOffset"
            aria-label="Reminder"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reminders.map((hours) => (
              <SelectItem value={hours.toString()} key={hours}>
                {t("x hours before", { hours: hours / oneHour })}
              </SelectItem>
            ))}
            <SelectItem value="0">{t("When due")}</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="reminderOffset">{t("Reminder")}</Label>
      </div>
    </div>
  );
}
