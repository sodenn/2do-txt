import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { cn } from "@/utils/tw-utils";

export function ConfirmationDialog() {
  const {
    open,
    title,
    content,
    buttons,
    onClose,
    closeConfirmationDialog,
    cleanupConfirmationDialog,
  } = useConfirmationDialogStore();

  const handleClose = () => {
    closeConfirmationDialog();
    setTimeout(() => {
      cleanupConfirmationDialog();
    }, 200);
  };

  const handleClick = (handler?: () => void) => {
    handler?.();
    handleClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
      handleClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent data-testid="confirmation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {buttons?.map((button) => (
            <Button
              key={button.text}
              color={button.color}
              onClick={() => handleClick(button.handler)}
              variant={button.cancel ? "outline" : undefined}
              className={cn(button.cancel && "mt-2 sm:mt-0")}
              aria-label={button.text}
            >
              {button.text}
            </Button>
          ))}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
