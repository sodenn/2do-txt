import {
  CancelOptions,
  LocalNotifications,
  LocalNotificationSchema,
  ScheduleOptions,
} from "@capacitor/local-notifications";
import { isAfter, subDays } from "date-fns";
import { useCallback, useEffect } from "react";
import { dateReviver } from "./date";
import { getPlatform } from "./platform";
import { getPreferencesItem, setPreferencesItem } from "./preferences";

interface ScheduledNotifications {
  id: number;
  receivingDate: Date;
}

export function useNotifications() {
  const platform = getPlatform();

  // Notifications in the browser must be re-scheduled because they are based on setTimeout
  const shouldNotificationsBeRescheduled = useCallback(() => {
    return platform === "web" || platform === "desktop";
  }, [platform]);

  const getScheduledNotifications = useCallback(async () => {
    const value = await getPreferencesItem("received-notifications");
    const scheduledNotifications: ScheduledNotifications[] = value
      ? JSON.parse(value, dateReviver)
      : [];
    return scheduledNotifications;
  }, []);

  useEffect(() => {
    if (!shouldNotificationsBeRescheduled()) {
      return;
    }
    // save identifiers of scheduled messages
    LocalNotifications.addListener(
      "localNotificationReceived",
      async (notification: LocalNotificationSchema) => {
        const scheduledNotifications = await getScheduledNotifications();
        const newValue: ScheduledNotifications[] = [
          ...scheduledNotifications,
          { id: notification.id, receivingDate: new Date() },
        ];
        setPreferencesItem("received-notifications", JSON.stringify(newValue));
      }
    );
    // cleanup: delete received message identifiers that are older than 48 hours
    const interval = setInterval(async () => {
      const scheduledNotifications = await getScheduledNotifications();
      const twoDaysAgo = subDays(new Date(), 2);
      const newValue = scheduledNotifications.filter((n) =>
        isAfter(n.receivingDate, twoDaysAgo)
      );
      setPreferencesItem("received-notifications", JSON.stringify(newValue));
    }, 1000 * 60);

    return () => {
      clearInterval(interval);
      LocalNotifications.removeAllListeners();
    };
  }, [getScheduledNotifications, shouldNotificationsBeRescheduled]);

  const scheduleNotifications = useCallback(
    async (options: ScheduleOptions) => {
      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== "granted") {
        return;
      }

      if (shouldNotificationsBeRescheduled()) {
        const scheduledNotifications = await getScheduledNotifications();
        const filteredNotifications = options.notifications.filter((n) =>
          scheduledNotifications.every((sn) => sn.id !== n.id)
        );
        return LocalNotifications.schedule({
          notifications: filteredNotifications,
        });
      }

      return LocalNotifications.schedule(options);
    },
    [getScheduledNotifications, shouldNotificationsBeRescheduled]
  );

  const checkNotificationPermissions = useCallback(
    () => LocalNotifications.checkPermissions(),
    []
  );

  const requestNotificationPermissions = useCallback(
    () => LocalNotifications.requestPermissions(),
    []
  );

  const cancelNotifications = useCallback(
    async (options: CancelOptions) => {
      await LocalNotifications.cancel(options).catch((error) =>
        console.log(error)
      );

      if (!shouldNotificationsBeRescheduled()) {
        return;
      }

      const scheduledNotifications = await getScheduledNotifications();

      const newScheduledNotifications = scheduledNotifications.filter((item) =>
        options.notifications.every((n) => n.id !== item.id)
      );

      setPreferencesItem(
        "received-notifications",
        JSON.stringify(newScheduledNotifications)
      );
    },
    [getScheduledNotifications, shouldNotificationsBeRescheduled]
  );

  return {
    scheduleNotifications,
    shouldNotificationsBeRescheduled,
    checkNotificationPermissions,
    requestNotificationPermissions,
    cancelNotifications,
  };
}
