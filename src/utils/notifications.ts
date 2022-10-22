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

interface ReceivedNotifications {
  id: number;
  receivingDate: Date;
}

export function useNotifications() {
  const platform = getPlatform();

  // Notifications in the browser must be re-scheduled because they are based on setTimeout
  const shouldNotificationsBeRescheduled = useCallback(() => {
    return platform === "web" || platform === "electron";
  }, [platform]);

  const getReceivedNotifications = useCallback(async () => {
    const value = await getPreferencesItem("received-notifications");

    const receivedNotifications: ReceivedNotifications[] = value
      ? JSON.parse(value, dateReviver)
      : [];

    return receivedNotifications;
  }, []);

  useEffect(() => {
    if (!shouldNotificationsBeRescheduled()) {
      return;
    }

    // save identifiers of received messages
    LocalNotifications.addListener(
      "localNotificationReceived",
      async (notification: LocalNotificationSchema) => {
        const receivedNotifications = await getReceivedNotifications();

        const newValue: ReceivedNotifications[] = [
          ...receivedNotifications,
          { id: notification.id, receivingDate: new Date() },
        ];

        setPreferencesItem("received-notifications", JSON.stringify(newValue));
      }
    );

    // cleanup: delete received message identifiers that are older than 48 hours
    const interval = setInterval(async () => {
      const receivedNotifications = await getReceivedNotifications();

      const twoDaysAgo = subDays(new Date(), 2);

      const newValue = receivedNotifications.filter((item) =>
        isAfter(item.receivingDate, twoDaysAgo)
      );

      setPreferencesItem("received-notifications", JSON.stringify(newValue));
    }, 1000 * 60);

    return () => {
      clearInterval(interval);
      LocalNotifications.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleNotifications = useCallback(
    async (options: ScheduleOptions) => {
      const permissionStatus = await LocalNotifications.checkPermissions();
      const receivedNotifications = await getReceivedNotifications();
      const notificationAlreadyReceived = receivedNotifications.some((r) =>
        options.notifications.some((n) => n.id === r.id)
      );
      if (
        permissionStatus.display === "granted" &&
        (!shouldNotificationsBeRescheduled() || !notificationAlreadyReceived)
      ) {
        return LocalNotifications.schedule(options);
      }
    },
    [getReceivedNotifications, shouldNotificationsBeRescheduled]
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

      const oldReceivedNotifications = await getReceivedNotifications();

      const newReceivedNotifications = oldReceivedNotifications.filter((item) =>
        options.notifications.every((n) => n.id !== item.id)
      );

      setPreferencesItem(
        "received-notifications",
        JSON.stringify(newReceivedNotifications)
      );
    },
    [getReceivedNotifications, shouldNotificationsBeRescheduled]
  );

  return {
    scheduleNotifications,
    shouldNotificationsBeRescheduled,
    checkNotificationPermissions,
    requestNotificationPermissions,
    cancelNotifications,
  };
}
