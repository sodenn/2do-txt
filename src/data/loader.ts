import { migrate1 } from "../utils/migrations";
import { getPlatform } from "../utils/platform";
import { CloudStorage, CloudStorageClient } from "./CloudStorageContext";
import * as cloudStorage from "./CloudStorageContext/cloud-storage";
import { filterStore } from "./filter-store";
import { platformStore } from "./platform-store";
import { settingsStore } from "./settings-store";
import { taskStore } from "./task-state";
import { themeStore } from "./theme-store";

export interface LoaderData {
  cloudStorageClients: Record<CloudStorage, CloudStorageClient>;
}

export async function loader(): Promise<LoaderData> {
  await migrate1();
  return Promise.all([
    cloudStorage.loadClients(),
    Promise.resolve(getPlatform()),
    filterStore.getState().init(),
    settingsStore.getState().init(),
    platformStore.getState().init(),
    themeStore.getState().init(),
    taskStore.getState().init(),
  ]).then(([cloudStorageClients]) => ({
    cloudStorageClients,
  }));
}
