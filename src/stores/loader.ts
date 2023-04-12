import { migrate } from "../utils/migrations";
import { cloudStorageLoader, cloudStorageStore } from "./cloud-storage-store";
import { filterLoader, filterStore } from "./filter-store";
import { networkLoader, networkStore } from "./network-store";
import { platformLoader, platformStore } from "./platform-store";
import { settingsLoader, settingsStore } from "./settings-store";
import { taskLoader, taskStore } from "./task-state";
import { themeLoader, themeStore } from "./theme-store";

export async function loader(): Promise<null> {
  await migrate();
  const [filter, settings, platform, theme, task, cloudStorage, network] =
    await Promise.all([
      filterLoader(),
      settingsLoader(),
      platformLoader(),
      themeLoader(),
      taskLoader(),
      cloudStorageLoader(),
      networkLoader(),
    ]);
  filterStore.getState().init(filter);
  settingsStore.getState().init(settings);
  platformStore.getState().init(platform);
  themeStore.getState().init(theme);
  taskStore.getState().init(task);
  cloudStorageStore.getState().init(cloudStorage);
  networkStore.getState().init(network);
  return null;
}
