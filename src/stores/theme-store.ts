import { PaletteMode, useMediaQuery } from "@mui/material";
import { createContext, useContext } from "react";
import { createStore, useStore as useZustandStore } from "zustand";
import { getPreferencesItem } from "@/native-api/preferences";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeStoreData {
  mode: ThemeMode;
}

interface ThemeStoreInterface extends ThemeStoreData {
  setThemeMode: (mode: ThemeMode) => void;
}

const getDefaultInitialState = (): ThemeStoreData => ({
  mode: "system",
});

export type ThemeStoreType = ReturnType<typeof initializeThemeStore>;

const zustandContext = createContext<ThemeStoreType | null>(null);

export const ThemeStoreProvider = zustandContext.Provider;

export async function themeLoader(): Promise<ThemeStoreData> {
  const mode = await getPreferencesItem<ThemeMode>("theme-mode");
  return { mode: mode || "system" };
}

export function usePaletteMode(): PaletteMode {
  let mode = useThemeStore((state) => state.mode);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  if (mode === "system") {
    mode = prefersDarkMode ? "dark" : "light";
  }
  return mode;
}

export function initializeThemeStore(
  preloadedState: Partial<ThemeStoreInterface> = {}
) {
  return createStore<ThemeStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
    setThemeMode: (mode: ThemeMode) => {
      set({ mode });
    },
  }));
}

export default function useThemeStore<T>(
  selector: (state: ThemeStoreInterface) => T
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
