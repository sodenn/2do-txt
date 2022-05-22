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
  const {
    confirmationDialog: { open, title, content, buttons, onClose },
    setConfirmationDialog,
  } = useConfirmationDialog();

  const handleClick = (handler?: () => void) => {
    handler?.();
    setConfirmationDialog((currentValue) => ({ ...currentValue, open: false }));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setConfirmationDialog((currentValue) => ({ ...currentValue, open: false }));
  };

  return (
    <Dialog
      maxWidth="xs"
      aria-label="Confirmation Dialog"
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: () => setConfirmationDialog({ open: false }),
      }}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <DialogContentText sx={{ overflow: "hidden", wordBreak: "break-word" }}>
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {buttons?.map((button, idx) => (
          <Button
            aria-label={button.text}
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
