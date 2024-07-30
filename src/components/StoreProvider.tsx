import {
  filterLoader,
  FilterStoreData,
  FilterStoreProvider,
  FilterStoreType,
  initializeFilterStore,
} from "@/stores/filter-store";
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
  theme: ThemeStoreData;
  task: TaskStoreData;
}

export async function loader(): Promise<LoaderData> {
  const [filter, settings, theme, task] = await Promise.all([
    filterLoader(),
    settingsLoader(),
    themeLoader(),
    taskLoader(),
    preloadImages([new URL("@/images/logo.png", import.meta.url)]),
  ]);
  return { filter, settings, theme, task };
}

export function StoreProvider({
  children,
  ...props
}: PropsWithChildren<LoaderData>) {
  const filterStoreRef = useRef<FilterStoreType>();
  const settingsStoreRef = useRef<SettingsStoreType>();
  const taskStoreRef = useRef<TaskStoreType>();
  const themeStoreRef = useRef<ThemeStoreType>();

  if (!filterStoreRef.current) {
    filterStoreRef.current = initializeFilterStore(props.filter);
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
      <SettingsStoreProvider value={settingsStoreRef.current}>
        <TaskStoreProvider value={taskStoreRef.current}>
          <ThemeStoreProvider value={themeStoreRef.current}>
            {children}
          </ThemeStoreProvider>
        </TaskStoreProvider>
      </SettingsStoreProvider>
    </FilterStoreProvider>
  );
}
