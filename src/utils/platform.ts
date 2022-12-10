import { Capacitor } from "@capacitor/core";

export function getPlatform() {
  return Capacitor.getPlatform();
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
