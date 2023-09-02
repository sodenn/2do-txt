import { subscribeNotifications } from "@/native-api/notification";
import { useEffect } from "react";

export function useNotificationsEffect() {
  useEffect(() => {
    const promise = subscribeNotifications();
    return () => {
      promise.then((unsubscribe) => unsubscribe());
    };
  }, []);
}
