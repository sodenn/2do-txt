import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.sodenn.todotxt",
  appName: "2do.txt",
  webDir: "build",
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#90caf9",
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
