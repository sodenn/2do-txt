import { Button } from "@/components/ui/button";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { SquareCheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NewFileButton() {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );
  return (
    <Button
      tabIndex={0}
      aria-label="Create task"
      onClick={() =>
        openFileCreateDialog({
          createFirstTask: true,
          createExampleFile: false,
        })
      }
    >
      <SquareCheckIcon className="mr-2 h-4 w-4" />
      {t("Create Task")}
    </Button>
  );
}
