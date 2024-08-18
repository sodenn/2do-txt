import { NotificationOptions, WebNotification } from "@/utils/notification";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useNotification() {
  const { t } = useTranslation();
  const webNotification = useMemo(() => new WebNotification(), []);

  const scheduleNotifications = useCallback(
    async (options: Omit<NotificationOptions, "title">[]) => {
      const optionsWithTitle = options.map((o) => ({
        ...o,
        title: t("Reminder"),
      }));

      const granted = await webNotification.isPermissionGranted();
      if (!granted) {
        return [];
      }

      return webNotification.schedule(optionsWithTitle);
    },
    [t, webNotification],
  );

  const isNotificationPermissionGranted = useCallback(() => {
    return webNotification.isPermissionGranted();
  }, [webNotification]);

  const requestNotificationPermission = useCallback(() => {
    return webNotification.requestPermission();
  }, [webNotification]);

  const cancelNotifications = useCallback(
    (notificationIds: number[]) => {
      return webNotification.cancel(notificationIds);
    },
    [webNotification],
  );

  useEffect(() => {
    return webNotification.startCleanup();
  }, [webNotification]);

  return {
    isNotificationPermissionGranted,
    requestNotificationPermission,
    cancelNotifications,
    scheduleNotifications,
  };
}
