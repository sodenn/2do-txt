import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { getPlatform, Platform } from "../utils/platform";

interface PlatformState {
  platform: Platform;
  init: () => Promise<void>;
}

const platformStore = createStore<PlatformState>((set) => ({
  platform: "web",
  init: async () => {
    const platform = getPlatform();
    set({ platform });
  },
}));

const usePlatform = ((selector: any) =>
  useStore(platformStore, selector)) as UseBoundStore<StoreApi<PlatformState>>;

export { platformStore };
export default usePlatform;
