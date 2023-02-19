import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import useConfirmationDialog from "../stores/confirmation-dialog-store";

const ConfirmationDialog = () => {
  const open = useConfirmationDialog((state) => state.open);
  const title = useConfirmationDialog((state) => state.title);
  const content = useConfirmationDialog((state) => state.content);
  const buttons = useConfirmationDialog((state) => state.buttons);
  const onClose = useConfirmationDialog((state) => state.onClose);
  const closeConfirmationDialog = useConfirmationDialog(
    (state) => state.closeConfirmationDialog
  );
  const cleanupConfirmationDialog = useConfirmationDialog(
    (state) => state.cleanupConfirmationDialog
  );

  const handleClick = (handler?: () => void) => {
    handler?.();
    closeConfirmationDialog();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    closeConfirmationDialog();
  };

  return (
    <Dialog
      maxWidth="xs"
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: () => cleanupConfirmationDialog(),
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
