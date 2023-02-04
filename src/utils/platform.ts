import { Capacitor } from "@capacitor/core";

type Platform = "desktop" | "web" | "ios" | "android";

export function getPlatform(): Platform {
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

export function hasTouchScreen() {
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
