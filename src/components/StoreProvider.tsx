import {
  FilterFields,
  filterLoader,
  FilterStore,
  FilterStoreProvider,
  initializeFilterStore,
} from "@/stores/filter-store";
import {
  initializeSettingsStore,
  SettingsFields,
  settingsLoader,
  SettingsStore,
  SettingsStoreProvider,
} from "@/stores/settings-store";
import {
  initializeTaskStore,
  TaskFields,
  taskLoader,
  TaskStore,
  TaskStoreProvider,
} from "@/stores/task-store";
import {
  initializeThemeStore,
  ThemeFields,
  themeLoader,
  ThemeStore,
  ThemeStoreProvider,
} from "@/stores/theme-store";
import { preloadImages } from "@/utils/images";
import { type PropsWithChildren, useRef } from "react";

export interface LoaderData {
  filter: FilterFields;
  settings: SettingsFields;
  theme: ThemeFields;
  task: TaskFields;
}

export async function loader(): Promise<LoaderData> {
  const [filter, settings, theme, task] = await Promise.all([
    filterLoader(),
    settingsLoader(),
    themeLoader(),
    taskLoader(),
    preloadImages([new URL("/logo.png", import.meta.url)]),
  ]);
  return { filter, settings, theme, task };
}

export function StoreProvider({
  children,
  ...props
}: PropsWithChildren<LoaderData>) {
  const filterStoreRef = useRef<FilterStore>(undefined);
  const settingsStoreRef = useRef<SettingsStore>(undefined);
  const taskStoreRef = useRef<TaskStore>(undefined);
  const themeStoreRef = useRef<ThemeStore>(undefined);

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
