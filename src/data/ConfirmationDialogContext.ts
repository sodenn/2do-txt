import { ReactNode, useState } from "react";
import { createContext } from "../utils/Context";

interface ConfirmationButtonProps {
  text: string;
  handler?: () => void;
}

interface ConfirmationDialogProps {
  title?: ReactNode;
  content: ReactNode;
  buttons: ConfirmationButtonProps[];
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
