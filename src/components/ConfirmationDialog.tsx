import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import useConfirmationDialogStore from "../stores/confirmation-dialog-store";

const ConfirmationDialog = () => {
  const open = useConfirmationDialogStore((state) => state.open);
  const title = useConfirmationDialogStore((state) => state.title);
  const content = useConfirmationDialogStore((state) => state.content);
  const buttons = useConfirmationDialogStore((state) => state.buttons);
  const onClose = useConfirmationDialogStore((state) => state.onClose);
  const closeConfirmationDialog = useConfirmationDialogStore(
    (state) => state.closeConfirmationDialog
  );
  const cleanupConfirmationDialog = useConfirmationDialogStore(
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
