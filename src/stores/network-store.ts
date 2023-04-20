import { createContext, useContext } from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { isConnected } from "../native-api/network";

export interface NetworkStoreData {
  connected: boolean;
  displayDate?: Date;
}

interface NetworkStoreInterface extends NetworkStoreData {
  displayDate?: Date;
  setConnected: (connected: boolean) => void;
  setDisplayDate: (displayDate?: Date) => void;
}

const getDefaultInitialState = (): NetworkStoreData => ({
  connected: true,
  displayDate: undefined,
});

export type NetworkStoreType = ReturnType<typeof initializeNetworkStore>;

const zustandContext = createContext<NetworkStoreType | null>(null);

export const NetworkStoreProvider = zustandContext.Provider;

export async function networkLoader(): Promise<NetworkStoreData> {
  const connected = await isConnected();
  return { connected };
}

export function initializeNetworkStore(
  preloadedState: Partial<NetworkStoreInterface> = {}
) {
  return createStore<NetworkStoreInterface>((set) => ({
    ...getDefaultInitialState(),
    ...preloadedState,
    setConnected: (connected: boolean) => set({ connected }),
    setDisplayDate: (displayDate?: Date) => set({ displayDate }),
  }));
}

export default function useNetworkStore<T = NetworkStoreInterface>(
  selector: (state: NetworkStoreInterface) => T = (state) => state as T
) {
  const store = useContext(zustandContext);
  if (!store) throw new Error("Store is missing the provider");
  return useZustandStore(store, selector);
}
