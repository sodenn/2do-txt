import { create } from "zustand";

interface ScrollingStoreInterface {
  top: number;
  setTop: (scrollTop: number) => void;
}

export const useScrollingStore = create<ScrollingStoreInterface>((set) => ({
  top: 0,
  setTop: (top: number) => set({ top }),
}));
