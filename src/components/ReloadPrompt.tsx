import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useRegisterSW } from "virtual:pwa-register/react";

export function ReloadPrompt() {
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      openConfirmationDialog({
        title: "New Update Available",
        content: "New content available, click on reload button to update.",
        buttons: [
          {
            text: "Close",
          },
          {
            text: "Reload",
            handler() {
              updateServiceWorker();
            },
          },
        ],
      });
    },
  });

  return null;
}
