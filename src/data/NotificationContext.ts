import { LocalNotifications } from "@capacitor/local-notifications";
import { differenceInHours, isAfter, subDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import logo from "../images/logo.png?raw";
import { createContext } from "../utils/Context";
import { dateReviver } from "../utils/date";
import { getPlatform } from "../utils/platform";
import { getPreferencesItem, setPreferencesItem } from "../utils/preferences";

interface ReceivedNotification {
  notificationId: number;
  receivingDate: Date;
}

interface TimeoutId {
  value: any;
  notificationId: number;
}

export interface ScheduleOptions {
  id: number;
  body: string;
  scheduleAt: Date;
}

interface ScheduleOptionsWithTitle extends ScheduleOptions {
  title: string;
}

export const [NotificationProvider, useNotification] = createContext(() => {
  const platform = getPlatform();
  const { t } = useTranslation();
  const { schedule: scheduleMobile, ...mobileNotifications } =
    useMobileNotifications();
  const { schedule: scheduleWeb, ...webNotifications } = useWebNotifications();
  const isWeb = platform === "web" || platform === "desktop";

  // Notifications in the browser must be re-scheduled because they are based on setTimeout
  const shouldNotificationsBeRescheduled = useCallback(() => isWeb, [isWeb]);

  const scheduleNotifications = useCallback(
    async (options: ScheduleOptions[]) => {
      const opt: ScheduleOptionsWithTitle[] = options.map((o) => {
        return {
          ...o,
          title: t("Reminder"),
        };
      });

      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== "granted") {
        return [];
      }

      return isWeb ? scheduleWeb(opt) : scheduleMobile(opt);
    },
    [isWeb, scheduleWeb, scheduleMobile, t]
  );

  return {
    ...(isWeb ? webNotifications : mobileNotifications),
    shouldNotificationsBeRescheduled,
    scheduleNotifications,
  };
});

function useMobileNotifications() {
  const isNotificationPermissionGranted = useCallback(
    () =>
      LocalNotifications.checkPermissions().then(
        (result) => result.display === "granted"
      ),
    []
  );

  const requestNotificationPermissions = useCallback(
    () =>
      LocalNotifications.requestPermissions().then(
        (result) => result.display === "granted"
      ),
    []
  );

  const cancelNotifications = useCallback(async (ids: number[]) => {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    }).catch((error) => console.error(error));
  }, []);

  const schedule = useCallback(
    async (options: ScheduleOptionsWithTitle[]): Promise<number[]> => {
      return LocalNotifications.schedule({
        notifications: options.map((opt) => ({
          id: opt.id,
          title: opt.title,
          body: opt.body,
          schedule: { at: opt.scheduleAt },
        })),
      }).then((result) => result.notifications.map((n) => n.id));
    },
    []
  );

  return {
    schedule,
    isNotificationPermissionGranted,
    requestNotificationPermissions,
    cancelNotifications,
  };
}

function useWebNotifications() {
  const [timeoutIds, setTimeoutIds] = useState<TimeoutId[]>([]);

  const getReceivedNotifications = useCallback(async () => {
    const value = await getPreferencesItem("received-notifications");
    const receivedNotifications: ReceivedNotification[] = value
      ? JSON.parse(value, dateReviver)
      : [];
    return receivedNotifications;
  }, []);

  const addReceivedNotification = useCallback(
    async (notification: ReceivedNotification) => {
      const receivedNotifications = await getReceivedNotifications();
      const newReceivedNotifications: ReceivedNotification[] = [
        ...receivedNotifications,
        notification,
      ];
      await setPreferencesItem(
        "received-notifications",
        JSON.stringify(newReceivedNotifications)
      );
    },
    [getReceivedNotifications]
  );

  const removeReceivedNotification = useCallback(
    async (ids: number[]) => {
      const receivedNotifications = await getReceivedNotifications();
      const newReceivedNotifications = receivedNotifications.filter(
        (item) => !ids.includes(item.notificationId)
      );
      await setPreferencesItem(
        "received-notifications",
        JSON.stringify(newReceivedNotifications)
      );
    },
    [getReceivedNotifications]
  );

  const createNotification = useCallback(
    (options: ScheduleOptionsWithTitle) => {
      const { scheduleAt, title, body, id } = options;
      const now = new Date();
      const diffInHours = differenceInHours(scheduleAt, now);
      const ms = scheduleAt.getTime() - new Date().getTime();
      if (diffInHours > -24) {
        const timeoutId = setTimeout(() => {
          new Notification(title, {
            body: body,
            icon: logo,
          });
          addReceivedNotification({
            notificationId: id,
            receivingDate: scheduleAt,
          });
        }, Math.max(ms, 0));
        setTimeoutIds((curr) => [
          ...curr,
          { notificationId: id, value: timeoutId },
        ]);
        return id;
      }
    },
    [addReceivedNotification]
  );

  const schedule = useCallback(
    async (options: ScheduleOptionsWithTitle[]): Promise<number[]> => {
      const receivedNotifications = await getReceivedNotifications();
      const filteredNotifications = options.filter((opt) =>
        receivedNotifications.every((sn) => sn.notificationId !== opt.id)
      );
      return filteredNotifications
        .map(createNotification)
        .filter((id): id is number => !!id);
    },
    [getReceivedNotifications, createNotification]
  );

  const isNotificationPermissionGranted = useCallback(
    async () => Notification.permission === "granted",
    []
  );

  const requestNotificationPermissions = useCallback(
    () =>
      Notification.requestPermission().then((result) => result === "granted"),
    []
  );

  const cancelNotifications = useCallback(
    async (ids: number[]) => {
      await removeReceivedNotification(ids);
      const newTimeoutIds = timeoutIds.filter(({ value, notificationId }) => {
        if (ids.includes(notificationId)) {
          clearTimeout(value);
          return false;
        } else {
          return true;
        }
      });
      setTimeoutIds(newTimeoutIds);
    },
    [removeReceivedNotification, timeoutIds]
  );

  useEffect(() => {
    // cleanup: remove old scheduled notifications
    const cleanupInterval = setInterval(async () => {
      const scheduledNotifications = await getReceivedNotifications();
      const twoDaysAgo = subDays(new Date(), 2);
      const newValue = scheduledNotifications.filter((n) =>
        isAfter(n.receivingDate, twoDaysAgo)
      );
      setPreferencesItem("received-notifications", JSON.stringify(newValue));
    }, 1000 * 60 * 60);
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [getReceivedNotifications]);

  return {
    schedule,
    isNotificationPermissionGranted,
    requestNotificationPermissions,
    cancelNotifications,
  };
}
