import { ResponsiveDialogTitle } from "@/components/ResponsiveDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { cn } from "@/utils/tw-utils";

export function ConfirmationDialog() {
  const open = useConfirmationDialogStore((state) => state.open);
  const title = useConfirmationDialogStore((state) => state.title);
  const content = useConfirmationDialogStore((state) => state.content);
  const buttons = useConfirmationDialogStore((state) => state.buttons);
  const onClose = useConfirmationDialogStore((state) => state.onClose);
  const closeConfirmationDialog = useConfirmationDialogStore(
    (state) => state.closeConfirmationDialog,
  );

  const handleClick = (handler?: () => void) => {
    handler?.();
    closeConfirmationDialog();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
      closeConfirmationDialog();
    }
  };

  return (
    <AlertDialog
      data-testid="confirmation-dialog"
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          {title && <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>}
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
