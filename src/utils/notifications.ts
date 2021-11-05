import {
  CancelOptions,
  LocalNotifications,
  LocalNotificationSchema,
  ScheduleOptions,
} from "@capacitor/local-notifications";
import { isAfter, subDays } from "date-fns";
import { useCallback, useEffect } from "react";
import { dateReviver } from "./date";
import { useStorage } from "./storage";

interface ReceivedNotifications {
  id: number;
  receivingDate: Date;
}

export function useNotifications() {
  const { setStorageItem, getStorageItem } = useStorage();

  const getReceivedNotifications = useCallback(async () => {
    const value = await getStorageItem("received-notifications");

    const receivedNotifications: ReceivedNotifications[] = value
      ? JSON.parse(value, dateReviver)
      : [];

    return receivedNotifications;
  }, [getStorageItem]);

  useEffect(() => {
    // save identifiers of received messages
    LocalNotifications.addListener(
      "localNotificationReceived",
      async (notification: LocalNotificationSchema) => {
        const receivedNotifications = await getReceivedNotifications();

        const newValue: ReceivedNotifications[] = [
          ...receivedNotifications,
          { id: notification.id, receivingDate: new Date() },
        ];

        setStorageItem("received-notifications", JSON.stringify(newValue));
      }
    );

    // cleanup: delete received message identifiers that are older than 24 hours
    const interval = setInterval(async () => {
      const receivedNotifications = await getReceivedNotifications();

      const twoDaysAgo = subDays(new Date(), 2);

      const newValue = receivedNotifications.filter((item) =>
        isAfter(item.receivingDate, twoDaysAgo)
      );

      setStorageItem("received-notifications", JSON.stringify(newValue));
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
      if (
        permissionStatus.display === "granted" &&
        receivedNotifications.every((r) =>
          options.notifications.every((n) => n.id !== r.id)
        )
      ) {
        return LocalNotifications.schedule(options);
      }
    },
    [getReceivedNotifications]
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

      const receivedNotifications = await getReceivedNotifications();
      const newReceivedNotifications = receivedNotifications.filter((item) =>
        options.notifications.every((n) => n.id !== item.id)
      );
      setStorageItem(
        "received-notifications",
        JSON.stringify(newReceivedNotifications)
      );
    },
    [getReceivedNotifications, setStorageItem]
  );

  return {
    scheduleNotifications,
    checkNotificationPermissions,
    requestNotificationPermissions,
    cancelNotifications,
  };
}
