import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getPreferencesItem } from "../native-api/preferences";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeLoaderData {
  mode: ThemeMode;
}

interface ThemeState extends ThemeLoaderData {
  setThemeMode: (mode: ThemeMode) => void;
  init: (data: ThemeLoaderData) => void;
}

export async function themeLoader(): Promise<ThemeLoaderData> {
  const mode = await getPreferencesItem<ThemeMode>("theme-mode");
  return { mode: mode || "system" };
}

export const themeStore = createStore<ThemeState>((set) => ({
  mode: "system",
  setThemeMode: (mode: ThemeMode) => {
    set({ mode });
  },
  init: (data: ThemeLoaderData) => set(data),
}));

const useThemeStore = ((selector: any) =>
  useStore(themeStore, selector)) as UseBoundStore<StoreApi<ThemeState>>;

export default useThemeStore;
