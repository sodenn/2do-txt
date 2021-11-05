import {
  CancelOptions,
  LocalNotificationSchema,
  ScheduleOptions,
  ScheduleResult,
} from "@capacitor/local-notifications";
import { PermissionStatus } from "@capacitor/local-notifications/dist/esm/definitions";

export const LocalNotifications = {
  async schedule(options: ScheduleOptions): Promise<ScheduleResult> {
    return {
      notifications: [],
    };
  },
  async checkPermissions(): Promise<PermissionStatus> {
    return { display: "granted" };
  },
  async requestPermissions(): Promise<PermissionStatus> {
    return { display: "granted" };
  },
  async cancel(options: CancelOptions): Promise<void> {},
  addListener(
    eventName: string,
    listenerFunc: (notification: LocalNotificationSchema) => void
  ) {},
  removeAllListeners() {},
};
