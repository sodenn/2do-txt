import { NotificationOptions, WebNotification } from "@/utils/notification";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

const webNotification = new WebNotification();

export function useNotification() {
  const { t } = useTranslation();

  const scheduleNotifications = useCallback(
    async (options: Omit<NotificationOptions, "title">[]) => {
      const opt = options.map((o) => {
        return {
          ...o,
          title: t("Reminder"),
        };
      });

      const granted = await webNotification.isPermissionGranted();
      if (!granted) {
        return [];
      }

      return webNotification.schedule(opt);
    },
    [t],
  );

  const isNotificationPermissionGranted = useCallback(() => {
    return webNotification.isPermissionGranted();
  }, []);

  const requestNotificationPermission = useCallback(() => {
    return webNotification.requestPermission();
  }, []);

  const cancelNotifications = useCallback((notificationIds: number[]) => {
    return webNotification.cancel(notificationIds);
  }, []);

  useEffect(() => {
    return webNotification.startCleanup();
  }, []);

  return {
    isNotificationPermissionGranted,
    requestNotificationPermission,
    cancelNotifications,
    scheduleNotifications,
  };
}
