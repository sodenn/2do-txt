import { getPreferencesItem, setPreferencesItem } from "@/utils/preferences";
import { createContext, useContext } from "react";
import { createStore, useStore as useZustandStore } from "zustand";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeFields {
  mode: ThemeMode;
}

interface ThemeState extends ThemeFields {
  setMode: (mode: ThemeMode) => void;
}

export type ThemeStore = ReturnType<typeof initializeThemeStore>;

const zustandContext = createContext<ThemeStore | null>(null);

export const ThemeStoreProvider = zustandContext.Provider;

export async function themeLoader(): Promise<ThemeFields> {
  const mode = await getPreferencesItem<ThemeMode>("theme-mode");
  return { mode: mode || "system" };
}

export function initializeThemeStore(preloadedState: Partial<ThemeState> = {}) {
  return createStore<ThemeState>((set) => ({
    mode: "system",
    ...preloadedState,
    setMode: (mode: ThemeMode) => {
      set({ mode });
      setPreferencesItem("theme-mode", mode);
    },
  }));
}

export function useThemeStore<T>(selector: (state: ThemeState) => T) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
