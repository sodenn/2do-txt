import { SplashScreen } from "@capacitor/splash-screen";
import { invoke } from "@tauri-apps/api/tauri";
import { getPlatform } from "./platform";

export function hideSplashScreen() {
  const platform = getPlatform();
  SplashScreen.hide();
  if (platform === "desktop") {
    invoke("close_splashscreen");
  }
}
