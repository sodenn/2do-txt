import { Keyboard, KeyboardStyleOptions } from "@capacitor/keyboard";
import { KeyboardInfo } from "@capacitor/keyboard/dist/esm/definitions";
import { getPlatform } from "./platform";

const platform = getPlatform();

export function addKeyboardDidShowListener(
  listener: (info: KeyboardInfo) => void
) {
  if (platform === "ios" || platform === "android") {
    Keyboard.addListener("keyboardDidShow", listener);
  }
}

export function addKeyboardDidHideListener(listener: () => void) {
  if (platform === "ios" || platform === "android") {
    Keyboard.addListener("keyboardDidHide", listener);
  }
}

export function removeAllKeyboardListeners() {
  if (platform === "ios" || platform === "android") {
    Keyboard.removeAllListeners().catch((e) => void e);
  }
}

export function setKeyboardStyle(options: KeyboardStyleOptions) {
  if (platform === "ios" || platform === "android") {
    Keyboard.setStyle(options).catch((e) => void e);
  }
}
