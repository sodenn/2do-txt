import { ipcMain } from "electron";
import { ElectronCapacitorApp } from "./setup";

export function setupSplashScreen(electronCapacitorApp: ElectronCapacitorApp) {
  ipcMain.handle("theme-ready", () => electronCapacitorApp.hideSplashScreen());
}
