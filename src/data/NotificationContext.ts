import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import {
  cancel,
  isPermissionGranted,
  Notification,
  requestPermission,
  schedule,
  shouldNotificationsBeRescheduled,
} from "../utils/notification";

export const [NotificationProvider, useNotification] = createContext(() => {
  const { t } = useTranslation();

  const scheduleNotifications = useCallback(
    async (options: Omit<Notification, "title">[]) => {
      const opt = options.map((o) => {
        return {
          ...o,
          title: t("Reminder"),
        };
      });

      const granted = await isPermissionGranted();
      if (!granted) {
        return [];
      }

      return schedule(opt);
    },
    [t]
  );

  return {
    isNotificationPermissionGranted: isPermissionGranted,
    requestNotificationPermission: requestPermission,
    cancelNotifications: cancel,
    shouldNotificationsBeRescheduled: shouldNotificationsBeRescheduled,
    scheduleNotifications,
  };
});
