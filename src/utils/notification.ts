import { dateReviver } from "@/utils/date";
import { getPreferencesItem, setPreferencesItem } from "@/utils/preferences";
import { differenceInHours, isAfter, subDays } from "date-fns";
import logo from "/logo.png";

export interface NotificationOptions {
  id: number;
  title: string;
  body: string;
  scheduleAt: Date;
  displayOffset?: number; // in milliseconds, optional
}

interface TimeoutId {
  timeoutId: ReturnType<typeof setTimeout>;
  notificationId: number;
}

interface DeliveredNotification {
  notificationId: number;
  receivingDate: Date;
}

export class WebNotification {
  private timeoutIds: TimeoutId[] = [];

  async isPermissionGranted() {
    return Notification.permission === "granted";
  }

  async requestPermission() {
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  async cancel(notificationIds: number[]) {
    await this.removeDeliveredNotification(notificationIds);
    this.timeoutIds = this.timeoutIds.filter(
      ({ timeoutId, notificationId }) => {
        if (notificationIds.includes(notificationId)) {
          clearTimeout(timeoutId);
          return false;
        }
        return true;
      },
    );
  }

  async schedule(options: NotificationOptions[]) {
    const receivedNotifications = await this.getDeliveredNotifications();
    const newNotifications = options.filter(
      (opt) => !receivedNotifications.some((n) => n.notificationId === opt.id),
    );
    return newNotifications
      .map(this.create.bind(this))
      .filter((id) => typeof id !== "undefined");
  }

  private create(options: NotificationOptions) {
    const {
      scheduleAt,
      title,
      body,
      id: notificationId,
      displayOffset = 0,
    } = options;
    const now = new Date();
    const displayTime = new Date(scheduleAt.getTime() - displayOffset);
    const diffInHours = differenceInHours(scheduleAt, now);
    const ms = displayTime.getTime() - now.getTime();

    // only create a notification if it's scheduled within the last 24 hours or in the future
    if (diffInHours > -24) {
      const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
        () => {
          new Notification(title, { body, icon: logo });
          this.addDeliveredNotification({
            notificationId,
            receivingDate: scheduleAt,
          });
          this.timeoutIds = this.timeoutIds.filter(
            (i) => i.timeoutId !== timeoutId,
          );
        },
        Math.max(ms, 0),
      );
      this.timeoutIds.push({ notificationId, timeoutId });
      return notificationId;
    }
  }

  private async getDeliveredNotifications(): Promise<DeliveredNotification[]> {
    const value = await getPreferencesItem("delivered-notifications");
    return value ? JSON.parse(value, dateReviver) : [];
  }

  private async addDeliveredNotification(notification: DeliveredNotification) {
    const receivedNotifications = await this.getDeliveredNotifications();
    const newDeliveredNotifications = [...receivedNotifications, notification];
    await this.updateDeliveredNotifications(newDeliveredNotifications);
  }

  private async removeDeliveredNotification(notificationIds: number[]) {
    const receivedNotifications = await this.getDeliveredNotifications();
    const newDeliveredNotifications = receivedNotifications.filter(
      (item) => !notificationIds.includes(item.notificationId),
    );
    await this.updateDeliveredNotifications(newDeliveredNotifications);
  }

  private async updateDeliveredNotifications(
    notifications: DeliveredNotification[],
  ) {
    await setPreferencesItem(
      "delivered-notifications",
      JSON.stringify(notifications),
    );
  }

  startCleanup() {
    const timer = setInterval(
      async () => {
        const scheduledNotifications = await this.getDeliveredNotifications();
        const twoDaysAgo = subDays(new Date(), 2);
        const newValue = scheduledNotifications.filter((n) =>
          isAfter(n.receivingDate, twoDaysAgo),
        );
        await this.updateDeliveredNotifications(newValue);
      },
      1000 * 60 * 60,
    );
    return () => clearInterval(timer);
  }
}
