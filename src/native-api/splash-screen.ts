import { getPlatform } from "@/native-api/platform";
import { SplashScreen } from "@capacitor/splash-screen";
import { invoke } from "@tauri-apps/api/tauri";

export async function hideSplashScreen(): Promise<void> {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    return SplashScreen.hide();
  }
  if (platform === "desktop") {
    return invoke("close_splashscreen").then(() => undefined);
  }
}
