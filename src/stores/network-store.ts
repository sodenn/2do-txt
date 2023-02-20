import { create } from "zustand";

interface NetworkState {
  connected: boolean;
  displayDate?: Date;
  setConnected: (connected: boolean) => void;
  setDisplayDate: (displayDate?: Date) => void;
}

const useNetworkStore = create<NetworkState>((set) => ({
  connected: true,
  displayDate: new Date(),
  setConnected: (connected: boolean) => set({ connected }),
  setDisplayDate: (displayDate?: Date) => set({ displayDate }),
}));

export default useNetworkStore;
