import { subscribeNotifications } from "@/utils/notification";
import { useEffect } from "react";

export function useNotificationsEffect() {
  useEffect(() => {
    const promise = subscribeNotifications();
    return () => {
      promise.then((unsubscribe) => unsubscribe());
    };
  }, []);
}
