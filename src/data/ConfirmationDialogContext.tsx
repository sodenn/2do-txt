import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { FC, ReactNode, useState } from "react";
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

const [ConfirmationDialogProviderInternal, useConfirmationDialog] =
  createContext(() => {
    const [confirmationDialog, setConfirmationDialog] = useState<
      ConfirmationDialogProps | undefined
    >(undefined);

    return {
      confirmationDialog,
      setConfirmationDialog,
    };
  });

const ConfirmationDialogProvider: FC = ({ children }) => {
  return (
    <ConfirmationDialogProviderInternal>
      {children}
      <ConfirmationDialog />
    </ConfirmationDialogProviderInternal>
  );
};

const ConfirmationDialog = () => {
  const { confirmationDialog, setConfirmationDialog } = useConfirmationDialog();

  const handleClick = (handler?: () => void) => {
    if (handler) {
      handler();
    }
    handleClose();
  };

  const handleClose = () => {
    setConfirmationDialog(undefined);
  };

  return (
    <Dialog
      maxWidth="xs"
      aria-label="Confirmation Dialog"
      open={!!confirmationDialog}
      onClose={handleClose}
    >
      {confirmationDialog?.title && (
        <DialogTitle>{confirmationDialog?.title}</DialogTitle>
      )}
      <DialogContent>
        <DialogContentText sx={{ overflow: "hidden", wordBreak: "break-word" }}>
          {confirmationDialog?.content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {confirmationDialog?.buttons.map((button, idx) => (
          <Button
            aria-label={button.text}
            autoFocus
            onClick={() => handleClick(button.handler)}
            key={idx}
          >
            {button.text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export { ConfirmationDialogProvider, useConfirmationDialog };
