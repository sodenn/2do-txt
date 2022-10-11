import { Keyboard, KeyboardStyleOptions } from "@capacitor/keyboard";
import { KeyboardInfo } from "@capacitor/keyboard/dist/esm/definitions";
import { useCallback } from "react";
import { getPlatform } from "./platform";

export function useKeyboard() {
  const platform = getPlatform();

  const addKeyboardDidShowListener = useCallback(
    (listener: (info: KeyboardInfo) => void) => {
      if (platform === "ios" || platform === "android") {
        Keyboard.addListener("keyboardDidShow", listener);
      }
    },
    [platform]
  );

  const addKeyboardDidHideListener = useCallback(
    (listener: () => void) => {
      if (platform === "ios" || platform === "android") {
        Keyboard.addListener("keyboardDidHide", listener);
      }
    },
    [platform]
  );

  const removeAllKeyboardListeners = useCallback(() => {
    if (platform === "ios" || platform === "android") {
      Keyboard.removeAllListeners().catch((e) => void e);
    }
  }, [platform]);

  const setKeyboardStyle = useCallback(
    (options: KeyboardStyleOptions) => {
      if (platform === "ios" || platform === "android") {
        Keyboard.setStyle(options).catch((e) => void e);
      }
    },
    [platform]
  );

  return {
    addKeyboardDidShowListener,
    addKeyboardDidHideListener,
    removeAllKeyboardListeners,
    setKeyboardStyle,
  };
}
