import { SplashScreen } from "@capacitor/splash-screen";
import { invoke } from "@tauri-apps/api/tauri";
import { getPlatform } from "@/native-api/platform";

export async function hideSplashScreen(): Promise<void> {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    return SplashScreen.hide();
  }
  if (platform === "desktop") {
    return invoke("close_splashscreen").then(() => undefined);
  }
}
