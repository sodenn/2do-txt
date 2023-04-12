import { StoreApi, UseBoundStore, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { Platform, getPlatform } from "../native-api/platform";

interface PlatformLoaderData {
  platform: Platform;
}

interface PlatformState extends PlatformLoaderData {
  init: (data: PlatformLoaderData) => void;
}

export async function platformLoader(): Promise<PlatformLoaderData> {
  const platform = getPlatform();
  return { platform };
}

export const platformStore = createStore<PlatformState>((set) => ({
  platform: "web",
  init: (data: PlatformLoaderData) => set(data),
}));

const usePlatformStore = ((selector: any) =>
  useStore(platformStore, selector)) as UseBoundStore<StoreApi<PlatformState>>;

export default usePlatformStore;
