import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { Box, Button } from "@mui/joy";

export function ConfirmationDialog() {
  const open = useConfirmationDialogStore((state) => state.open);
  const title = useConfirmationDialogStore((state) => state.title);
  const content = useConfirmationDialogStore((state) => state.content);
  const buttons = useConfirmationDialogStore((state) => state.buttons);
  const onClose = useConfirmationDialogStore((state) => state.onClose);
  const closeConfirmationDialog = useConfirmationDialogStore(
    (state) => state.closeConfirmationDialog,
  );
  const cleanupConfirmationDialog = useConfirmationDialogStore(
    (state) => state.cleanupConfirmationDialog,
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
    <ResponsiveDialog
      fullScreen={false}
      open={open}
      onClose={handleClose}
      onExited={cleanupConfirmationDialog}
    >
      {title && <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>}
      <ResponsiveDialogContent>
        <Box sx={{ overflow: "hidden", wordBreak: "break-word" }}>
          {content}
        </Box>
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        {buttons?.map((button) => (
          <Button
            key={button.text}
            color={button.color}
            onClick={() => handleClick(button.handler)}
            aria-label={button.text}
          >
            {button.text}
          </Button>
        ))}
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  );
}
