import { ReactNode, useState } from "react";
import { createContext } from "../utils/Context";

export interface ConfirmationButtonProps {
  text: string;
  handler?: () => void;
}

export interface ConfirmationDialogProps {
  title?: ReactNode;
  content: ReactNode;
  buttons: ConfirmationButtonProps[];
  onClose?: () => void;
}

const [ConfirmationDialogProvider, useConfirmationDialog] = createContext(
  () => {
    const [confirmationDialog, setConfirmationDialog] = useState<
      ConfirmationDialogProps | undefined
    >(undefined);

    return {
      confirmationDialog,
      setConfirmationDialog,
    };
  }
);

export { ConfirmationDialogProvider, useConfirmationDialog };
