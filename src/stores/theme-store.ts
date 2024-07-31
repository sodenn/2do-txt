import { getPreferencesItem, setPreferencesItem } from "@/native-api/storage";
import { createContext, useContext } from "react";
import { createStore, useStore as useZustandStore } from "zustand";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeStoreData {
  mode: ThemeMode;
}

interface ThemeStoreInterface extends ThemeStoreData {
  setMode: (mode: ThemeMode) => void;
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

export function initializeThemeStore(
  preloadedState: Partial<ThemeStoreInterface> = {},
) {
  return createStore<ThemeStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
    setMode: (mode: ThemeMode) => {
      set({ mode });
      setPreferencesItem("theme-mode", mode);
    },
  }));
}

export function useThemeStore<T>(selector: (state: ThemeStoreInterface) => T) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
