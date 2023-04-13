import { useEffect } from "react";
import { subscribeNotifications } from "../native-api/notification";

export function useNotificationsEffect() {
  useEffect(() => {
    const promise = subscribeNotifications();
    return () => {
      promise.then((unsubscribe) => unsubscribe());
    };
  }, []);
}
