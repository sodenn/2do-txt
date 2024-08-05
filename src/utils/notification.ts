import { dateReviver } from "@/utils/date";
import { getPreferencesItem, setPreferencesItem } from "@/utils/preferences";
import { differenceInHours, isAfter, subDays } from "date-fns";
import logo from "/logo.png";

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

interface WebNotification {
  subscribe: () => () => void;
  timeoutIds: TimeoutId[];
  isPermissionGranted(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  cancel(ids: number[]): Promise<void>;
  schedule(notifications: Notification[]): Promise<number[]>;
  shouldNotificationsBeRescheduled(): Promise<boolean>;
  getReceivedNotifications(): Promise<ReceivedNotification[]>;
  addReceivedNotification(notification: ReceivedNotification): Promise<void>;
  removeReceivedNotification(ids: number[]): Promise<void>;
  createNotification(options: Notification): number | undefined;
}

const webNotification: WebNotification = {
  timeoutIds: [],
  async isPermissionGranted() {
    return Notification.requestPermission().then(
      (result) => result === "granted",
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
      },
    );
  },
  async schedule(notifications: Notification[]) {
    const receivedNotifications =
      await webNotification.getReceivedNotifications();
    const filteredNotifications = notifications.filter((opt) =>
      receivedNotifications.every((sn) => sn.notificationId !== opt.id),
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
      const timeoutId = setTimeout(
        () => {
          new Notification(title, {
            body: body,
            icon: logo,
          });
          webNotification.addReceivedNotification({
            notificationId: id,
            receivingDate: scheduleAt,
          });
        },
        Math.max(ms, 0),
      );
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
      JSON.stringify(newReceivedNotifications),
    );
  },
  async removeReceivedNotification(ids: number[]) {
    const receivedNotifications =
      await webNotification.getReceivedNotifications();
    const newReceivedNotifications = receivedNotifications.filter(
      (item) => !ids.includes(item.notificationId),
    );
    await setPreferencesItem(
      "received-notifications",
      JSON.stringify(newReceivedNotifications),
    );
  },
  subscribe() {
    const timer = window.setInterval(
      async () => {
        const scheduledNotifications =
          await webNotification.getReceivedNotifications();
        const twoDaysAgo = subDays(new Date(), 2);
        const newValue = scheduledNotifications.filter((n) =>
          isAfter(n.receivingDate, twoDaysAgo),
        );
        setPreferencesItem("received-notifications", JSON.stringify(newValue));
      },
      1000 * 60 * 60,
    );
    return () => {
      clearInterval(timer);
    };
  },
};

export async function subscribeNotifications(): Promise<() => void> {
  return webNotification.subscribe();
}

export async function cancelNotifications(ids: number[]): Promise<void> {
  return webNotification.cancel(ids);
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  return webNotification.isPermissionGranted();
}

export async function requestNotificationPermission(): Promise<boolean> {
  return webNotification.requestPermission();
}

export async function scheduleNotifications(
  notifications: Notification[],
): Promise<number[]> {
  return webNotification.schedule(notifications);
}

export async function shouldNotificationsBeRescheduled() {
  return webNotification.shouldNotificationsBeRescheduled();
}
