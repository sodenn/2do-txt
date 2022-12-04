import { SplashScreen } from "@capacitor/splash-screen";

export function hideSplashScreen() {
  SplashScreen.hide();
  setTimeout(() => {
    window.electron.hideSplashScreen();
  }, 200);
}
