const CAN_USE_DOM: boolean =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  typeof window.document.createElement !== "undefined";

export const IS_ANDROID: boolean =
  CAN_USE_DOM && /Android/.test(navigator.userAgent);

// const IS_CHROME: boolean =
//   CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent);
//
// const IS_ANDROID_CHROME: boolean = CAN_USE_DOM && IS_ANDROID && IS_CHROME;

export const IS_SAFARI: boolean =
  CAN_USE_DOM && /Version\/[\d.]+.*Safari/.test(navigator.userAgent);

export const IS_IOS: boolean =
  CAN_USE_DOM &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  // @ts-ignore
  !window.MSStream;

export const TEST_MODE = import.meta.env.MODE === "test";

export const SUPPORTS_SHOW_OPEN_FILE_PICKER =
  "showSaveFilePicker" in window &&
  "showOpenFilePicker" in window &&
  !TEST_MODE;

export const HAS_TOUCHSCREEN = hasTouchScreen();

export const HAS_HIDDEN_SCROLLBAR = getScrollbarWidth() === 0;

function hasTouchScreen() {
  if ("maxTouchPoints" in navigator) {
    return navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function getScrollbarWidth() {
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = "scroll";

  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  outer.parentNode?.removeChild(outer);

  return widthNoScroll - widthWithScroll;
}
