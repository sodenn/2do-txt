import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { isConnected } from "../native-api/network";

interface NetworkLoaderData {
  connected: boolean;
}

interface NetworkState extends NetworkLoaderData {
  displayDate?: Date;
  setConnected: (connected: boolean) => void;
  setDisplayDate: (displayDate?: Date) => void;
  init: (data: NetworkLoaderData) => void;
}

export async function networkLoader(): Promise<NetworkLoaderData> {
  const connected = await isConnected();
  return { connected };
}

export const networkStore = createStore<NetworkState>((set) => ({
  connected: true,
  displayDate: undefined,
  setConnected: (connected: boolean) => set({ connected }),
  setDisplayDate: (displayDate?: Date) => set({ displayDate }),
  init: (data: NetworkLoaderData) => set(data),
}));

const useNetworkStore = ((selector: any) =>
  useStore(networkStore, selector)) as UseBoundStore<StoreApi<NetworkState>>;

export default useNetworkStore;
