import {
  CloudLoaderData,
  CloudStoreProvider,
  CloudStoreType,
  cloudLoader,
  initializeCloudStore,
} from "@/stores/cloud-store";
import {
  FilterStoreData,
  FilterStoreProvider,
  FilterStoreType,
  filterLoader,
  initializeFilterStore,
} from "@/stores/filter-store";
import {
  NetworkStoreData,
  NetworkStoreProvider,
  NetworkStoreType,
  initializeNetworkStore,
  networkLoader,
} from "@/stores/network-store";
import {
  PlatformStoreData,
  PlatformStoreProvider,
  PlatformStoreType,
  initializePlatformStore,
  platformLoader,
} from "@/stores/platform-store";
import {
  SettingsStoreData,
  SettingsStoreProvider,
  SettingsStoreType,
  initializeSettingsStore,
  settingsLoader,
} from "@/stores/settings-store";
import {
  TaskStoreData,
  TaskStoreProvider,
  TaskStoreType,
  initializeTaskStore,
  taskLoader,
} from "@/stores/task-state";
import {
  ThemeStoreData,
  ThemeStoreProvider,
  ThemeStoreType,
  initializeThemeStore,
  themeLoader,
} from "@/stores/theme-store";
import { preloadImages } from "@/utils/images";
import { migrate } from "@/utils/migrations";
import { useRef, type PropsWithChildren } from "react";

export interface LoaderData {
  filter: FilterStoreData;
  settings: SettingsStoreData;
  platform: PlatformStoreData;
  theme: ThemeStoreData;
  task: TaskStoreData;
  cloud: CloudLoaderData;
  network: NetworkStoreData;
}

export async function loader(): Promise<LoaderData> {
  await migrate();
  const [filter, settings, platform, theme, task, cloud, network] =
    await Promise.all([
      filterLoader(),
      settingsLoader(),
      platformLoader(),
      themeLoader(),
      taskLoader(),
      cloudLoader(),
      networkLoader(),
      preloadImages([new URL("@/images/logo.png", import.meta.url)]),
    ]);
  return { filter, settings, platform, theme, task, cloud, network };
}

export function StoreProvider({
  children,
  ...props
}: PropsWithChildren<LoaderData>) {
  const cloudStoreRef = useRef<CloudStoreType>();
  const filterStoreRef = useRef<FilterStoreType>();
  const networkStoreRef = useRef<NetworkStoreType>();
  const platformStoreRef = useRef<PlatformStoreType>();
  const settingsStoreRef = useRef<SettingsStoreType>();
  const taskStoreRef = useRef<TaskStoreType>();
  const themeStoreRef = useRef<ThemeStoreType>();

  if (!cloudStoreRef.current) {
    cloudStoreRef.current = initializeCloudStore(props.cloud);
  }
  if (!filterStoreRef.current) {
    filterStoreRef.current = initializeFilterStore(props.filter);
  }
  if (!networkStoreRef.current) {
    networkStoreRef.current = initializeNetworkStore(props.network);
  }
  if (!platformStoreRef.current) {
    platformStoreRef.current = initializePlatformStore(props.platform);
  }
  if (!settingsStoreRef.current) {
    settingsStoreRef.current = initializeSettingsStore(props.settings);
  }
  if (!taskStoreRef.current) {
    taskStoreRef.current = initializeTaskStore(props.task);
  }
  if (!themeStoreRef.current) {
    themeStoreRef.current = initializeThemeStore(props.theme);
  }

  return (
    <CloudStoreProvider value={cloudStoreRef.current}>
      <FilterStoreProvider value={filterStoreRef.current}>
        <NetworkStoreProvider value={networkStoreRef.current}>
          <PlatformStoreProvider value={platformStoreRef.current}>
            <SettingsStoreProvider value={settingsStoreRef.current}>
              <TaskStoreProvider value={taskStoreRef.current}>
                <ThemeStoreProvider value={themeStoreRef.current}>
                  {children}
                </ThemeStoreProvider>
              </TaskStoreProvider>
            </SettingsStoreProvider>
          </PlatformStoreProvider>
        </NetworkStoreProvider>
      </FilterStoreProvider>
    </CloudStoreProvider>
  );
}
