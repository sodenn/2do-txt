import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getPlatform, Platform } from "../utils/platform";

interface PlatformState {
  platform: Platform;
  load: () => Promise<void>;
}

const platformStore = createStore<PlatformState>((set) => ({
  platform: "web",
  load: async () => {
    const platform = getPlatform();
    set({ platform });
  },
}));

const usePlatformStore = ((selector: any) =>
  useStore(platformStore, selector)) as UseBoundStore<StoreApi<PlatformState>>;

export { platformStore };
export default usePlatformStore;
