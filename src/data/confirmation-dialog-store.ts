import { ReactNode } from "react";
import { create } from "zustand";

export interface ConfirmationButtonOptions {
  text: string;
  handler?: () => void;
}

export interface ConfirmationDialogOptions {
  title?: ReactNode;
  content?: ReactNode;
  buttons?: ConfirmationButtonOptions[];
  onClose?: () => void;
}

export interface ConfirmationDialogState extends ConfirmationDialogOptions {
  open: boolean;
  openConfirmationDialog: (opt: ConfirmationDialogOptions) => void;
  closeConfirmationDialog: () => void;
  cleanupConfirmationDialog: () => void;
}

const useConfirmationDialog = create<ConfirmationDialogState>((set) => ({
  open: false,
  title: undefined,
  content: undefined,
  buttons: undefined,
  onClose: undefined,
  openConfirmationDialog: (opt: ConfirmationDialogOptions) =>
    set({ ...opt, open: true }),
  closeConfirmationDialog: () => set((state) => ({ ...state, open: false })),
  cleanupConfirmationDialog: () => set({ open: false }),
}));

export default useConfirmationDialog;
