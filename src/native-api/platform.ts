import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

type Platform = "desktop" | "web" | "ios" | "android";

function getPlatform(): Platform {
  if ((window as any).__TAURI__) {
    return "desktop";
  }

  const platform = Capacitor.getPlatform();

  if (platform === "ios") {
    return "ios";
  }

  if (platform === "android") {
    return "android";
  }

  if (platform === "web") {
    return "web";
  }

  throw new Error();
}

function hasTouchScreen() {
  if ("maxTouchPoints" in navigator) {
    return navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
    return (navigator as any).msMaxTouchPoints > 0;
  } else {
    const mediaQueryList = matchMedia("(pointer:coarse)");
    if (mediaQueryList && mediaQueryList.media === "(pointer:coarse)") {
      return mediaQueryList.matches;
    } else if ("orientation" in window) {
      return true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      // @ts-ignore
      const userAgent = navigator.userAgent;
      return (
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(userAgent) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(userAgent)
      );
    }
  }
}

async function addBecomeActiveListener(listener: () => unknown) {
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
}

async function removeAllBecomeActiveListeners(listeners: (() => unknown)[]) {
  const platform = getPlatform();
  if (platform === "web" || platform === "desktop") {
    listeners?.forEach((listener) =>
      window.removeEventListener("focus", listener)
    );
  }
  if (platform === "ios" || platform === "android") {
    App.removeAllListeners();
  }
}

export type { Platform };
export {
  getPlatform,
  hasTouchScreen,
  addBecomeActiveListener,
  removeAllBecomeActiveListeners,
};
