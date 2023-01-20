import { App } from "@capacitor/app";
import { useEffect } from "react";
import { getPlatform } from "./platform";

export function useBecomeActive(listener: () => unknown) {
  const platform = getPlatform();
  useEffect(() => {
    if (platform === "web" || platform === "electron") {
      window.addEventListener("focus", listener);
    }
    if (platform === "ios" || platform === "android") {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          listener();
        }
      });
    }
    return () => {
      if (platform === "web" || platform === "electron") {
        window.removeEventListener("focus", listener);
      }
      if (platform === "ios" || platform === "android") {
        App.removeAllListeners();
      }
    };
  }, [listener, platform]);
}
