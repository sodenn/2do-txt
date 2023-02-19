import { create } from "zustand";

interface SideSheetState {
  open: boolean;
  toggleSideSheet: () => void;
  openSideSheet: () => void;
  closeSideSheet: () => void;
}

const useSideSheet = create<SideSheetState>((set) => ({
  open: false,
  toggleSideSheet: () => set((state) => ({ open: !state.open })),
  openSideSheet: () => set({ open: true }),
  closeSideSheet: () => set({ open: false }),
}));

export default useSideSheet;
