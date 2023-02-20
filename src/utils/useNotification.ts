import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  cancelNotifications,
  initNotifications,
  isNotificationPermissionGranted,
  Notification,
  requestNotificationPermission,
  scheduleNotifications as _scheduleNotifications,
  shouldNotificationsBeRescheduled,
} from "../native-api/notification";

function useNotification() {
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
    [t]
  );

  useEffect(() => {
    initNotifications();
  }, []);

  return {
    isNotificationPermissionGranted: isNotificationPermissionGranted,
    requestNotificationPermission: requestNotificationPermission,
    cancelNotifications: cancelNotifications,
    shouldNotificationsBeRescheduled: shouldNotificationsBeRescheduled,
    scheduleNotifications,
  };
}

export default useNotification;
