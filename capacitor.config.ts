import { CapacitorElectronConfig } from "@capacitor-community/electron";

const config: CapacitorElectronConfig = {
  appId: "dev.sodenn.todotxt",
  appName: "2do.txt",
  webDir: "build",
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#90caf9",
    },
    Keyboard: {
      resizeOnFullScreen: true,
      resize: "body",
    },
  },
  electron: {
    splashScreenEnabled: true,
    splashScreenImageName: "splash.png",
  },
};

export default config;
