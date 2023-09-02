import { create } from "zustand";

interface SideSheetStoreInterface {
  open: boolean;
  toggleSideSheet: () => void;
  openSideSheet: () => void;
  closeSideSheet: () => void;
}

export const useSideSheetStore = create<SideSheetStoreInterface>((set) => ({
  open: false,
  toggleSideSheet: () => set((state) => ({ open: !state.open })),
  openSideSheet: () => set({ open: true }),
  closeSideSheet: () => set({ open: false }),
}));
