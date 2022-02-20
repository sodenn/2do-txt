import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";

const ConfirmationDialog = () => {
  const { confirmationDialog, setConfirmationDialog } = useConfirmationDialog();

  const handleClick = (handler?: () => void) => {
    if (handler) {
      handler();
    }
    setConfirmationDialog(undefined);
  };

  const handleClose = () => {
    if (confirmationDialog && confirmationDialog.onClose) {
      confirmationDialog.onClose();
    }
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

export default ConfirmationDialog;
