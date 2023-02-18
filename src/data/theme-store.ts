import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getPreferencesItem } from "../utils/preferences";

type ThemeMode = "dark" | "light" | "system";

interface ThemeState {
  mode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  init: () => Promise<void>;
}

const themeStore = createStore<ThemeState>((set) => ({
  mode: "system",
  setThemeMode: (mode: ThemeMode) => {
    set({ mode });
  },
  init: async () => {
    const mode = await getPreferencesItem<ThemeMode>("theme-mode");
    set({ mode: mode || "system" });
  },
}));

const useTheme = ((selector: any) =>
  useStore(themeStore, selector)) as UseBoundStore<StoreApi<ThemeState>>;

export type { ThemeMode };
export { themeStore };
export default useTheme;
