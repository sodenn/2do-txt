import { ButtonProps } from "@mui/joy";
import { ReactNode } from "react";
import { create } from "zustand";

interface ConfirmationButtonOptions {
  text: string;
  color?: ButtonProps["color"];
  handler?: () => void;
}

interface ConfirmationDialogOptions {
  title?: ReactNode;
  content?: ReactNode;
  buttons?: ConfirmationButtonOptions[];
  onClose?: () => void;
}

interface ConfirmationDialogStoreData extends ConfirmationDialogOptions {
  open: boolean;
}

interface ConfirmationDialogStoreInterface extends ConfirmationDialogStoreData {
  openConfirmationDialog: (opt: ConfirmationDialogOptions) => void;
  closeConfirmationDialog: () => void;
  cleanupConfirmationDialog: () => void;
}

export const useConfirmationDialogStore =
  create<ConfirmationDialogStoreInterface>((set) => ({
    open: false,
    title: undefined,
    content: undefined,
    buttons: undefined,
    onClose: undefined,
    openConfirmationDialog: (opt: ConfirmationDialogOptions) =>
      set({ ...opt, open: true }),
    closeConfirmationDialog: () => set({ open: false }),
    cleanupConfirmationDialog: () =>
      set({
        open: false,
        title: undefined,
        content: undefined,
        buttons: undefined,
        onClose: undefined,
      }),
  }));
