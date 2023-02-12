import { LocalNotifications } from "@capacitor/local-notifications";
import { differenceInHours, isAfter, subDays } from "date-fns";
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
}

class MobileNotification implements NotificationMethods {
  async isPermissionGranted() {
    return LocalNotifications.checkPermissions().then(
      (result) => result.display === "granted"
    );
  }
  async requestPermission() {
    return LocalNotifications.requestPermissions().then(
      (result) => result.display === "granted"
    );
  }
  async cancel(ids: number[]) {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  }
  async schedule(notifications: Notification[]) {
    return LocalNotifications.schedule({
      notifications: notifications.map(({ id, title, body, scheduleAt }) => ({
        id,
        title,
        body,
        schedule: { at: scheduleAt },
      })),
    }).then((result) => result.notifications.map((n) => n.id));
  }

  async shouldNotificationsBeRescheduled() {
    return false;
  }
}

class WebNotification implements NotificationMethods {
  private static timeoutIds: TimeoutId[] = [];

  constructor() {
    setInterval(async () => {
      const scheduledNotifications = await this.getReceivedNotifications();
      const twoDaysAgo = subDays(new Date(), 2);
      const newValue = scheduledNotifications.filter((n) =>
        isAfter(n.receivingDate, twoDaysAgo)
      );
      setPreferencesItem("received-notifications", JSON.stringify(newValue));
    }, 1000 * 60 * 60);
  }

  async isPermissionGranted() {
    return Notification.requestPermission().then(
      (result) => result === "granted"
    );
  }

  async requestPermission() {
    return Notification.permission === "granted";
  }

  async cancel(ids: number[]) {
    await this.removeReceivedNotification(ids);
    WebNotification.timeoutIds = WebNotification.timeoutIds.filter(
      ({ value, notificationId }) => {
        if (ids.includes(notificationId)) {
          clearTimeout(value);
          return false;
        } else {
          return true;
        }
      }
    );
  }

  async schedule(notifications: Notification[]) {
    const receivedNotifications = await this.getReceivedNotifications();
    const filteredNotifications = notifications.filter((opt) =>
      receivedNotifications.every((sn) => sn.notificationId !== opt.id)
    );
    return filteredNotifications
      .map(this.createNotification)
      .filter((id): id is number => !!id);
  }

  async shouldNotificationsBeRescheduled() {
    return true;
  }

  private createNotification(options: Notification) {
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
      WebNotification.timeoutIds = [
        ...WebNotification.timeoutIds,
        { notificationId: id, value: timeoutId },
      ];
      return id;
    }
  }

  private async getReceivedNotifications() {
    const value = await getPreferencesItem("received-notifications");
    const receivedNotifications: ReceivedNotification[] = value
      ? JSON.parse(value, dateReviver)
      : [];
    return receivedNotifications;
  }

  private async addReceivedNotification(notification: ReceivedNotification) {
    const receivedNotifications = await this.getReceivedNotifications();
    const newReceivedNotifications: ReceivedNotification[] = [
      ...receivedNotifications,
      notification,
    ];
    await setPreferencesItem(
      "received-notifications",
      JSON.stringify(newReceivedNotifications)
    );
  }

  private async removeReceivedNotification(ids: number[]) {
    const receivedNotifications = await this.getReceivedNotifications();
    const newReceivedNotifications = receivedNotifications.filter(
      (item) => !ids.includes(item.notificationId)
    );
    await setPreferencesItem(
      "received-notifications",
      JSON.stringify(newReceivedNotifications)
    );
  }
}

class DefaultNotification implements NotificationMethods {
  private mobileNotification = new MobileNotification();
  private webNotification = new WebNotification();

  async cancel(ids: number[]): Promise<void> {
    const platform = getPlatform();
    return ["ios", "android"].includes(platform)
      ? this.mobileNotification.cancel(ids)
      : this.webNotification.cancel(ids);
  }

  async isPermissionGranted(): Promise<boolean> {
    const platform = getPlatform();
    return ["ios", "android"].includes(platform)
      ? this.mobileNotification.isPermissionGranted()
      : this.webNotification.isPermissionGranted();
  }

  async requestPermission(): Promise<boolean> {
    const platform = getPlatform();
    return ["ios", "android"].includes(platform)
      ? this.mobileNotification.requestPermission()
      : this.webNotification.requestPermission();
  }

  async schedule(notifications: Notification[]): Promise<number[]> {
    const platform = getPlatform();
    return ["ios", "android"].includes(platform)
      ? this.mobileNotification.schedule(notifications)
      : this.webNotification.schedule(notifications);
  }

  async shouldNotificationsBeRescheduled() {
    const platform = getPlatform();
    return ["ios", "android"].includes(platform)
      ? this.mobileNotification.shouldNotificationsBeRescheduled()
      : this.webNotification.shouldNotificationsBeRescheduled();
  }
}

const {
  isPermissionGranted,
  requestPermission,
  shouldNotificationsBeRescheduled,
  cancel,
  schedule,
} = new DefaultNotification();

export {
  isPermissionGranted,
  requestPermission,
  shouldNotificationsBeRescheduled,
  cancel,
  schedule,
};
