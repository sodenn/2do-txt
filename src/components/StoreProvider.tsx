import {
  filterLoader,
  FilterStoreData,
  FilterStoreProvider,
  FilterStoreType,
  initializeFilterStore,
} from "@/stores/filter-store";
import {
  initializeNetworkStore,
  networkLoader,
  NetworkStoreData,
  NetworkStoreProvider,
  NetworkStoreType,
} from "@/stores/network-store";
import {
  initializePlatformStore,
  platformLoader,
  PlatformStoreData,
  PlatformStoreProvider,
  PlatformStoreType,
} from "@/stores/platform-store";
import {
  initializeSettingsStore,
  settingsLoader,
  SettingsStoreData,
  SettingsStoreProvider,
  SettingsStoreType,
} from "@/stores/settings-store";
import {
  initializeTaskStore,
  taskLoader,
  TaskStoreData,
  TaskStoreProvider,
  TaskStoreType,
} from "@/stores/task-state";
import {
  initializeThemeStore,
  themeLoader,
  ThemeStoreData,
  ThemeStoreProvider,
  ThemeStoreType,
} from "@/stores/theme-store";
import { preloadImages } from "@/utils/images";
import { useRef, type PropsWithChildren } from "react";

export interface LoaderData {
  filter: FilterStoreData;
  settings: SettingsStoreData;
  platform: PlatformStoreData;
  theme: ThemeStoreData;
  task: TaskStoreData;
  network: NetworkStoreData;
}

export async function loader(): Promise<LoaderData> {
  const [filter, settings, platform, theme, task, network] = await Promise.all([
    filterLoader(),
    settingsLoader(),
    platformLoader(),
    themeLoader(),
    taskLoader(),
    networkLoader(),
    preloadImages([new URL("@/images/logo.png", import.meta.url)]),
  ]);
  return { filter, settings, platform, theme, task, network };
}

export function StoreProvider({
  children,
  ...props
}: PropsWithChildren<LoaderData>) {
  const filterStoreRef = useRef<FilterStoreType>();
  const networkStoreRef = useRef<NetworkStoreType>();
  const platformStoreRef = useRef<PlatformStoreType>();
  const settingsStoreRef = useRef<SettingsStoreType>();
  const taskStoreRef = useRef<TaskStoreType>();
  const themeStoreRef = useRef<ThemeStoreType>();

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
  );
}
