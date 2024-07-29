import { create } from "zustand";

interface ScrollingStoreInterface {
  divider: boolean;
  setDivider: (divider: boolean) => void;
}

export const useScrollingStore = create<ScrollingStoreInterface>((set) => ({
  divider: false,
  setDivider: (divider: boolean) => set({ divider }),
}));
