import { StatusBar, Style } from "@capacitor/status-bar";
import { ThemeMode } from "../stores/theme-store";

export function setStatusBarStyling(mode: ThemeMode) {
  StatusBar.setStyle({
    style:
      mode === "light"
        ? Style.Light
        : mode === "dark"
        ? Style.Dark
        : Style.Default,
  }).catch((error) => void error);
}
