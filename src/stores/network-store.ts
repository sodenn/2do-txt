import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { isConnected } from "../native-api/network";

interface NetworkState {
  connected: boolean;
  displayDate?: Date;
  setConnected: (connected: boolean) => void;
  setDisplayDate: (displayDate?: Date) => void;
  load: () => Promise<void>;
}

const networkStore = createStore<NetworkState>((set) => ({
  connected: true,
  displayDate: undefined,
  setConnected: (connected: boolean) => set({ connected }),
  setDisplayDate: (displayDate?: Date) => set({ displayDate }),
  load: async () => {
    const connected = await isConnected();
    set({ connected });
  },
}));

const useNetworkStore = ((selector: any) =>
  useStore(networkStore, selector)) as UseBoundStore<StoreApi<NetworkState>>;

export { networkStore };
export default useNetworkStore;
