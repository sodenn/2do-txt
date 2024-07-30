export const CAN_USE_DOM: boolean =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined";

export const IS_ANDROID: boolean =
  CAN_USE_DOM && /Android/.test(navigator.userAgent);

export const IS_CHROME: boolean =
  CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent);
// export const canUseTextInputEvent: boolean = CAN_USE_DOM && 'TextEvent' in window && !documentMode;

export const IS_ANDROID_CHROME: boolean =
  CAN_USE_DOM && IS_ANDROID && IS_CHROME;

export const IS_SAFARI: boolean =
  CAN_USE_DOM && /Version\/[\d.]+.*Safari/.test(navigator.userAgent);

export const IS_IOS: boolean =
  CAN_USE_DOM &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  // @ts-ignore
  !window.MSStream;

export const SUPPORTS_SHOW_OPEN_FILE_PICKER = IS_CHROME && !IS_ANDROID_CHROME;

export const SUPPORTS_REMOVE_FILE = IS_CHROME && !IS_ANDROID_CHROME;

export const HAS_TOUCHSCREEN = hasTouchScreen();

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
