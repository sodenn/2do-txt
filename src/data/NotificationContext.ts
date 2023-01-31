import {
  CancelOptions,
  LocalNotifications,
  LocalNotificationSchema,
  ScheduleOptions,
  ScheduleResult,
} from "@capacitor/local-notifications";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";
import { isAfter, subDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import logo from "../images/logo.png?raw";
import { createContext } from "../utils/Context";
import { dateReviver } from "../utils/date";
import { getPlatform } from "../utils/platform";
import { getPreferencesItem, setPreferencesItem } from "../utils/preferences";

//const base64LogoString = window.btoa(unescape(encodeURIComponent(logo)));
//const base64Logo = "data:image/png;base64," + base64LogoString;

interface ReceivedNotification {
  notificationId: number;
  receivingDate: Date;
}

interface TimeoutId {
  value: any;
  notificationId: number;
}

export const [NotificationProvider, useNotifications] = createContext(() => {
  const platform = getPlatform();
  const { t } = useTranslation();
  const { schedule: scheduleMobile, ...mobileNotifications } =
    useMobileNotifications();
  const { schedule: scheduleWeb, ...webNotifications } = useWebNotifications();
  const isWeb = platform === "web" || platform === "desktop";

  // Notifications in the browser must be re-scheduled because they are based on setTimeout
  const shouldNotificationsBeRescheduled = useCallback(() => isWeb, [isWeb]);

  const scheduleNotifications = useCallback(
    async (options: ScheduleOptions) => {
      options.notifications.forEach((n) => {
        if (!n.title) {
          n.title = t("Reminder");
        }
      });

      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== "granted") {
        return;
      }

      return isWeb
        ? scheduleWeb(options.notifications)
        : scheduleMobile(options.notifications);
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

  const cancelNotifications = useCallback(async (options: CancelOptions) => {
    await LocalNotifications.cancel(options).catch((error) =>
      console.error(error)
    );
  }, []);

  const schedule = useCallback(
    async (
      notifications: LocalNotificationSchema[]
    ): Promise<ScheduleResult> => {
      return LocalNotifications.schedule({
        notifications: notifications,
      });
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

  const addScheduledNotifications = useCallback(
    async (notifications: ReceivedNotification[]) => {
      const receivedNotifications = await getReceivedNotifications();
      const newReceivedNotifications: ReceivedNotification[] = [
        ...receivedNotifications,
        ...notifications,
      ];
      await setPreferencesItem(
        "received-notifications",
        JSON.stringify(newReceivedNotifications)
      );
    },
    [getReceivedNotifications]
  );

  const removeReceivedNotifications = useCallback(
    async (ids: number[]) => {
      const receivedNotifications = await getReceivedNotifications();
      const newReceivedNotifications = receivedNotifications.filter(
        (item) => !ids.includes(item.notificationId)
      );
      await setPreferencesItem(
        "received-notifications",
        JSON.stringify(newReceivedNotifications)
      );
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
    [getReceivedNotifications, timeoutIds]
  );

  const send = (notification: LocalNotificationSchema) => {
    const { schedule, title, body, id } = notification;
    const ms = schedule?.at ? schedule.at.getTime() - new Date().getTime() : 0;
    if (ms > -86400000) {
      const timeoutId = setTimeout(() => {
        sendNotification({
          title: title,
          body: body,
          icon: logo,
        });
      }, ms);
      setTimeoutIds((curr) => [
        ...curr,
        { notificationId: id, value: timeoutId },
      ]);
    }
    return notification;
  };

  const schedule = useCallback(
    async (
      notifications: LocalNotificationSchema[]
    ): Promise<ScheduleResult> => {
      const receivedNotifications = await getReceivedNotifications();
      const filteredNotifications = notifications.filter((n) =>
        receivedNotifications.every((sn) => sn.notificationId !== n.id)
      );

      const scheduledNotifications = filteredNotifications
        .map(send)
        .filter((n) => n.schedule?.at)
        .map((n) => ({
          notificationId: n.id,
          receivingDate: n.schedule!.at!,
        }));

      await addScheduledNotifications(scheduledNotifications);
      return { notifications: filteredNotifications };
    },
    [addScheduledNotifications, getReceivedNotifications]
  );

  const isNotificationPermissionGranted = useCallback(
    () => isPermissionGranted(),
    []
  );

  const requestNotificationPermissions = useCallback(
    () => requestPermission().then((result) => result === "granted"),
    []
  );

  const cancelNotifications = useCallback(
    async (options: CancelOptions) => {
      const ids = options.notifications.map((n) => n.id);
      await removeReceivedNotifications(ids);
    },
    [removeReceivedNotifications]
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
    }, 1000 * 60);
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
