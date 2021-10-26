import {
  CancelOptions,
  LocalNotifications,
  ScheduleOptions,
} from "@capacitor/local-notifications";
import { useCallback } from "react";

export function useNotifications() {
  const schedule = useCallback(async (options: ScheduleOptions) => {
    const permissionStatus = await LocalNotifications.checkPermissions();
    if (permissionStatus.display === "granted") {
      return LocalNotifications.schedule(options);
    }
  }, []);

  const checkPermissions = useCallback(
    () => LocalNotifications.checkPermissions(),
    []
  );

  const requestPermissions = useCallback(
    () => LocalNotifications.requestPermissions(),
    []
  );

  const cancel = useCallback(
    (options: CancelOptions) =>
      LocalNotifications.cancel(options).catch((error) => console.log(error)),
    []
  );

  return { schedule, checkPermissions, requestPermissions, cancel };
}
