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
import { dateReviver } from "./date";
import { getPlatform } from "./platform";
import { getPreferencesItem, setPreferencesItem } from "./preferences";

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

export function useNotifications() {
  const platform = getPlatform();
  const { t } = useTranslation();
  const [, setTimeoutIds] = useState<TimeoutId[]>([]);

  // Notifications in the browser must be re-scheduled because they are based on setTimeout
  const shouldNotificationsBeRescheduled = useCallback(() => {
    return platform === "web" || platform === "desktop";
  }, [platform]);

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
      setTimeoutIds((currentValue) =>
        currentValue.filter(({ value, notificationId }) => {
          if (ids.includes(notificationId)) {
            clearTimeout(value);
            return false;
          } else {
            return true;
          }
        })
      );
    },
    [getReceivedNotifications]
  );

  const schedule = useCallback(
    async (
      notifications: LocalNotificationSchema[]
    ): Promise<ScheduleResult> => {
      if (platform === "desktop") {
        const scheduledNotifications = notifications
          .map((n) => {
            const ms = n.schedule?.at
              ? n.schedule.at.getTime() - new Date().getTime()
              : 0;
            if (ms > -86400000) {
              const timeoutId = setTimeout(() => {
                sendNotification({
                  title: n.title,
                  body: n.body,
                  icon: logo,
                });
              }, ms);
              setTimeoutIds((curr) => [
                ...curr,
                { notificationId: n.id, value: timeoutId },
              ]);
            }
            return n;
          })
          .filter((n) => n.schedule?.at)
          .map((n) => ({
            notificationId: n.id,
            receivingDate: n.schedule!.at!,
          }));
        await addScheduledNotifications(scheduledNotifications);
        return { notifications };
      } else {
        return LocalNotifications.schedule({
          notifications: notifications,
        });
      }
    },
    [addScheduledNotifications, platform]
  );

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

      if (shouldNotificationsBeRescheduled()) {
        const receivedNotifications = await getReceivedNotifications();
        const filteredNotifications = options.notifications.filter((n) =>
          receivedNotifications.every((sn) => sn.notificationId !== n.id)
        );
        return await schedule(filteredNotifications);
      }

      return schedule(options.notifications);
    },
    [getReceivedNotifications, shouldNotificationsBeRescheduled, schedule, t]
  );

  const checkNotificationPermissions = useCallback(
    () =>
      platform === "desktop"
        ? isPermissionGranted()
        : LocalNotifications.checkPermissions(),
    [platform]
  );

  const requestNotificationPermissions = useCallback(
    () =>
      platform === "desktop"
        ? requestPermission()
        : LocalNotifications.requestPermissions(),
    [platform]
  );

  const cancelNotifications = useCallback(
    async (options: CancelOptions) => {
      if (platform !== "desktop") {
        await LocalNotifications.cancel(options).catch((error) =>
          console.error(error)
        );
      }
      if (shouldNotificationsBeRescheduled()) {
        await removeReceivedNotifications(
          options.notifications.map((n) => n.id)
        );
      }
    },
    [removeReceivedNotifications, shouldNotificationsBeRescheduled, platform]
  );

  useEffect(() => {
    if (!shouldNotificationsBeRescheduled()) {
      return;
    }
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
  }, [getReceivedNotifications, shouldNotificationsBeRescheduled]);

  return {
    scheduleNotifications,
    shouldNotificationsBeRescheduled,
    checkNotificationPermissions,
    requestNotificationPermissions,
    cancelNotifications,
  };
}
