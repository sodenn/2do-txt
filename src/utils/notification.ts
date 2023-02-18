import { LocalNotifications } from "@capacitor/local-notifications";
import { differenceInHours, isAfter, subDays } from "date-fns";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import logo from "../images/logo.png";
import { dateReviver } from "./date";
import { getPlatform } from "./platform";
import { getPreferencesItem, setPreferencesItem } from "./preferences";

export interface Notification {
  id: number;
  title: string;
  body: string;
  scheduleAt: Date;
}

interface TimeoutId {
  value: any;
  notificationId: number;
}

interface ReceivedNotification {
  notificationId: number;
  receivingDate: Date;
}

interface NotificationMethods {
  isPermissionGranted(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  cancel(ids: number[]): Promise<void>;
  schedule(notifications: Notification[]): Promise<number[]>;
  shouldNotificationsBeRescheduled(): Promise<boolean>;
  init: () => void;
}

interface WebNotification extends NotificationMethods {
  timeoutIds: TimeoutId[];
  getReceivedNotifications(): Promise<ReceivedNotification[]>;
  addReceivedNotification(notification: ReceivedNotification): Promise<void>;
  removeReceivedNotification(ids: number[]): Promise<void>;
  createNotification(options: Notification): number | undefined;
}

const mobileNotification: NotificationMethods = {
  async isPermissionGranted() {
    return LocalNotifications.checkPermissions().then(
      (result) => result.display === "granted"
    );
  },
  async requestPermission() {
    return LocalNotifications.requestPermissions().then(
      (result) => result.display === "granted"
    );
  },
  async cancel(ids: number[]) {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  },
  async schedule(notifications: Notification[]) {
    return LocalNotifications.schedule({
      notifications: notifications.map(({ id, title, body, scheduleAt }) => ({
        id,
        title,
        body,
        schedule: { at: scheduleAt },
      })),
    }).then((result) => result.notifications.map((n) => n.id));
  },
  async shouldNotificationsBeRescheduled() {
    return false;
  },
  init() {
    // do nothing
  },
};

const webNotification: WebNotification = {
  timeoutIds: [],
  async isPermissionGranted() {
    return Notification.requestPermission().then(
      (result) => result === "granted"
    );
  },
  async requestPermission() {
    return Notification.permission === "granted";
  },
  async cancel(ids: number[]) {
    await webNotification.removeReceivedNotification(ids);
    webNotification.timeoutIds = webNotification.timeoutIds.filter(
      ({ value, notificationId }) => {
        if (ids.includes(notificationId)) {
          clearTimeout(value);
          return false;
        } else {
          return true;
        }
      }
    );
  },
  async schedule(notifications: Notification[]) {
    const receivedNotifications =
      await webNotification.getReceivedNotifications();
    const filteredNotifications = notifications.filter((opt) =>
      receivedNotifications.every((sn) => sn.notificationId !== opt.id)
    );
    return filteredNotifications
      .map(webNotification.createNotification)
      .filter((id): id is number => !!id);
  },
  async shouldNotificationsBeRescheduled() {
    return true;
  },
  createNotification(options: Notification) {
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
        this.addReceivedNotification({
          notificationId: id,
          receivingDate: scheduleAt,
        });
      }, Math.max(ms, 0));
      webNotification.timeoutIds = [
        ...webNotification.timeoutIds,
        { notificationId: id, value: timeoutId },
      ];
      return id;
    }
  },
  async getReceivedNotifications() {
    const value = await getPreferencesItem("received-notifications");
    const receivedNotifications: ReceivedNotification[] = value
      ? JSON.parse(value, dateReviver)
      : [];
    return receivedNotifications;
  },
  async addReceivedNotification(notification: ReceivedNotification) {
    const receivedNotifications =
      await webNotification.getReceivedNotifications();
    const newReceivedNotifications: ReceivedNotification[] = [
      ...receivedNotifications,
      notification,
    ];
    await setPreferencesItem(
      "received-notifications",
      JSON.stringify(newReceivedNotifications)
    );
  },
  async removeReceivedNotification(ids: number[]) {
    const receivedNotifications =
      await webNotification.getReceivedNotifications();
    const newReceivedNotifications = receivedNotifications.filter(
      (item) => !ids.includes(item.notificationId)
    );
    await setPreferencesItem(
      "received-notifications",
      JSON.stringify(newReceivedNotifications)
    );
  },
  init() {
    setInterval(async () => {
      const scheduledNotifications = await this.getReceivedNotifications();
      const twoDaysAgo = subDays(new Date(), 2);
      const newValue = scheduledNotifications.filter((n) =>
        isAfter(n.receivingDate, twoDaysAgo)
      );
      setPreferencesItem("received-notifications", JSON.stringify(newValue));
    }, 1000 * 60 * 60);
  },
};

async function init(): Promise<void> {
  const platform = getPlatform();
  return ["ios", "android"].includes(platform)
    ? mobileNotification.init()
    : webNotification.init();
}

async function cancel(ids: number[]): Promise<void> {
  const platform = getPlatform();
  return ["ios", "android"].includes(platform)
    ? mobileNotification.cancel(ids)
    : webNotification.cancel(ids);
}

async function isPermissionGranted(): Promise<boolean> {
  const platform = getPlatform();
  return ["ios", "android"].includes(platform)
    ? mobileNotification.isPermissionGranted()
    : webNotification.isPermissionGranted();
}

async function requestPermission(): Promise<boolean> {
  const platform = getPlatform();
  return ["ios", "android"].includes(platform)
    ? mobileNotification.requestPermission()
    : webNotification.requestPermission();
}

async function schedule(notifications: Notification[]): Promise<number[]> {
  const platform = getPlatform();
  return ["ios", "android"].includes(platform)
    ? mobileNotification.schedule(notifications)
    : webNotification.schedule(notifications);
}

async function shouldNotificationsBeRescheduled() {
  const platform = getPlatform();
  return ["ios", "android"].includes(platform)
    ? mobileNotification.shouldNotificationsBeRescheduled()
    : webNotification.shouldNotificationsBeRescheduled();
}

init();

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

      const granted = await isPermissionGranted();
      if (!granted) {
        return [];
      }

      return schedule(opt);
    },
    [t]
  );

  return {
    isNotificationPermissionGranted: isPermissionGranted,
    requestNotificationPermission: requestPermission,
    cancelNotifications: cancel,
    shouldNotificationsBeRescheduled: shouldNotificationsBeRescheduled,
    scheduleNotifications,
  };
}

export { useNotification };
