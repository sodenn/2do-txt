import { create } from "zustand";

interface ScrollingState {
  divider: boolean;
  setDivider: (divider: boolean) => void;
}

export const useScrollingStore = create<ScrollingState>((set) => ({
  divider: false,
  setDivider: (divider: boolean) => set({ divider }),
}));
