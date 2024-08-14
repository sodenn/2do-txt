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

  useEffect(() => {
    return webNotification.startCleanup();
  }, []);

  return {
    isNotificationPermissionGranted: webNotification.isPermissionGranted,
    requestNotificationPermission: webNotification.requestPermission,
    cancelNotifications: webNotification.cancel,
    scheduleNotifications,
  };
}
