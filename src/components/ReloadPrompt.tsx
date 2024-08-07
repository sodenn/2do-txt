import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useEffect } from "react";
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
            variant: "outline",
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

  useEffect(() => {
    openConfirmationDialog({
      title: "New Update Available",
      content: "New content available, click on reload button to update.",
      buttons: [
        {
          text: "Close",
          variant: "outline",
        },
        {
          text: "Reload",
          handler() {},
        },
      ],
    });
  }, []);

  return null;
}
