import { Keyboard, KeyboardStyle as _KeyboardStyle } from "@capacitor/keyboard";
import { getPlatform } from "@/native-api/platform";

interface KeyboardInfo {
  keyboardHeight: number;
}

type KeyboardStyle = "dark" | "light" | "system";

export async function addKeyboardDidShowListener(
  listener: (info: KeyboardInfo) => void
) {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    Keyboard.addListener("keyboardDidShow", listener);
  }
}

export async function addKeyboardDidHideListener(listener: () => void) {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    Keyboard.addListener("keyboardDidHide", listener);
  }
}

export async function removeAllKeyboardListeners() {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    Keyboard.removeAllListeners().catch((e) => void e);
  }
}

export async function setKeyboardStyle(style: KeyboardStyle) {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    Keyboard.setStyle({ style: getStyle(style) }).catch((e) => void e);
  }
}

function getStyle(style: KeyboardStyle) {
  switch (style) {
    case "dark":
      return _KeyboardStyle.Dark;
    case "light":
      return _KeyboardStyle.Light;
    default:
      return _KeyboardStyle.Default;
  }
}
