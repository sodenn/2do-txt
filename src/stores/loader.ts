import { migrate1, migrate2 } from "../utils/migrations";
import { cloudStorageStore } from "./cloud-storage-store";
import { filterStore } from "./filter-store";
import { networkStore } from "./network-store";
import { platformStore } from "./platform-store";
import { settingsStore } from "./settings-store";
import { taskStore } from "./task-state";
import { themeStore } from "./theme-store";

export async function loader(): Promise<void> {
  await migrate1();
  await migrate2();
  return Promise.all([
    filterStore.getState().load(),
    settingsStore.getState().load(),
    platformStore.getState().load(),
    themeStore.getState().load(),
    taskStore.getState().load(),
    cloudStorageStore.getState().load(),
    networkStore.getState().load(),
  ]).then();
}
