import { Button } from "@/components/ui/button";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import { SquareCheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NewFileButton() {
  const { t } = useTranslation();
  // const openFileCreateDialog = useFileCreateDialogStore(
  //   (state) => state.openFileCreateDialog,
  // );
  const { showSaveFilePicker } = useFilePicker();
  const { createNewTodoFile } = useTask();

  const handleClick = async () => {
    const result = await showSaveFilePicker();
    if (result) {
      await createNewTodoFile(result.id, "");
    }
  };

  return (
    <Button tabIndex={0} aria-label="Create task" onClick={handleClick}>
      <SquareCheckIcon className="mr-2 h-4 w-4" />
      {t("Create Task")}
    </Button>
  );
}
