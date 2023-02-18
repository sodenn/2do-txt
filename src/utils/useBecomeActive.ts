import { App } from "@capacitor/app";
import { useCallback, useEffect } from "react";
import { getPlatform } from "./platform";

export function useBecomeActive(listener: () => unknown) {
  const handleMount = useCallback(async () => {
    const platform = getPlatform();
    if (platform === "web" || platform === "desktop") {
      window.addEventListener("focus", listener);
    }
    if (platform === "ios" || platform === "android") {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          listener();
        }
      });
    }
  }, [listener]);

  const handleUnmount = useCallback(async () => {
    const platform = getPlatform();
    if (platform === "web" || platform === "desktop") {
      window.removeEventListener("focus", listener);
    }
    if (platform === "ios" || platform === "android") {
      App.removeAllListeners();
    }
  }, [listener]);

  useEffect(() => {
    handleMount();
    return () => {
      handleUnmount();
    };
  }, [handleMount, handleUnmount]);
}
