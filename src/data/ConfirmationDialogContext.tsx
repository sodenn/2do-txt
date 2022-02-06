import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { FC, useState } from "react";
import { createContext } from "../utils/Context";

interface ConfirmationButtonProps {
  text: string;
  handler?: () => void;
}

interface ConfirmationDialogProps {
  title?: string;
  content: string;
  buttons: ConfirmationButtonProps[];
}

const [ConfirmationDialogContext, useConfirmationDialog] = createContext(() => {
  const [confirmationDialog, setConfirmationDialog] = useState<
    ConfirmationDialogProps | undefined
  >(undefined);

  return {
    confirmationDialog,
    setConfirmationDialog,
  };
});

const ConfirmationDialogContextProvider: FC = ({ children }) => {
  return (
    <ConfirmationDialogContext>
      {children}
      <ConfirmationDialog />
    </ConfirmationDialogContext>
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
        <DialogContentText>{confirmationDialog?.content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {confirmationDialog?.buttons.map((button, idx) => (
          <Button
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

export { ConfirmationDialogContextProvider, useConfirmationDialog };
