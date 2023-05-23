import { create } from "zustand";

interface ScrollingStoreInterface {
  top: boolean;
  setTop: (scrollTop: boolean) => void;
}

const useScrollingStore = create<ScrollingStoreInterface>((set) => ({
  top: true,
  setTop: (top: boolean) => set({ top }),
}));

export default useScrollingStore;
