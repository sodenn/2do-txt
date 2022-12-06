import { SplashScreen } from "@capacitor/splash-screen";
import { getPlatform } from "./platform";

export function hideSplashScreen() {
  const platform = getPlatform();
  SplashScreen.hide();
  if (platform === "electron") {
    setTimeout(() => {
      window.electron.hideSplashScreen();
    }, 200);
  }
}
