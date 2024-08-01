import { ButtonProps } from "@/components/ui/button";
import { ReactNode } from "react";
import { create } from "zustand";

interface ConfirmationButtonOptions {
  text: string;
  color?: ButtonProps["color"];
  handler?: () => void;
  cancel?: boolean;
}

interface ConfirmationDialogOptions {
  title?: ReactNode;
  content?: ReactNode;
  buttons?: ConfirmationButtonOptions[];
  onClose?: () => void;
}

interface ConfirmationDialogState extends ConfirmationDialogOptions {
  open: boolean;
  openConfirmationDialog: (opt: ConfirmationDialogOptions) => void;
  closeConfirmationDialog: () => void;
  cleanupConfirmationDialog: () => void;
}

export const useConfirmationDialogStore = create<ConfirmationDialogState>(
  (set) => ({
    open: false,
    title: undefined,
    content: undefined,
    buttons: undefined,
    onClose: undefined,
    openConfirmationDialog: (opt: ConfirmationDialogOptions) =>
      set({ ...opt, open: true }),
    closeConfirmationDialog: () => {
      set({ open: false });
    },
    cleanupConfirmationDialog: () =>
      set({
        open: false,
        title: undefined,
        content: undefined,
        buttons: undefined,
        onClose: undefined,
      }),
  }),
);
