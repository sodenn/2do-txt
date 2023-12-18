import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.sodenn.todotxt",
  appName: "2do.txt",
  webDir: "build",
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
};

export default config;
