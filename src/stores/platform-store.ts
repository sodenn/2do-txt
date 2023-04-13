import { createContext, useContext } from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { Platform, getPlatform } from "../native-api/platform";

export interface PlatformStoreData {
  platform: Platform;
}

type PlatformStoreInterface = PlatformStoreData;

const getDefaultInitialState = (): PlatformStoreData => ({
  platform: "web",
});

export type PlatformStoreType = ReturnType<typeof initializePlatformStore>;

const zustandContext = createContext<PlatformStoreType | null>(null);

export const PlatformStoreProvider = zustandContext.Provider;

export async function platformLoader(): Promise<PlatformStoreData> {
  const platform = getPlatform();
  return { platform };
}

export function initializePlatformStore(
  preloadedState: Partial<PlatformStoreInterface> = {}
) {
  return createStore<PlatformStoreInterface>((set, get) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
  }));
}

export const platformStore = createStore<PlatformStoreInterface>((set) => ({
  platform: "web",
  init: (data: PlatformStoreData) => set(data),
}));

export default function usePlatformStore<T>(
  selector: (state: PlatformStoreInterface) => T
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
