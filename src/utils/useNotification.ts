import {
  scheduleNotifications as _scheduleNotifications,
  cancelNotifications,
  isNotificationPermissionGranted,
  Notification,
  requestNotificationPermission,
} from "@/utils/notification";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useNotification() {
  const { t } = useTranslation();

  const scheduleNotifications = useCallback(
    async (options: Omit<Notification, "title">[]) => {
      const opt = options.map((o) => {
        return {
          ...o,
          title: t("Reminder"),
        };
      });

      const granted = await isNotificationPermissionGranted();
      if (!granted) {
        return [];
      }

      return _scheduleNotifications(opt);
    },
    [t],
  );

  return {
    isNotificationPermissionGranted: isNotificationPermissionGranted,
    requestNotificationPermission: requestNotificationPermission,
    cancelNotifications: cancelNotifications,
    scheduleNotifications,
  };
}
