import { Button } from "@/components/ui/button";
import { useFilesystem } from "@/utils/useFilesystem";
import { useTask } from "@/utils/useTask";
import { SquareCheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NewFileButton() {
  const { t } = useTranslation();
  const { createNewTodoFile } = useTask();
  const { showSaveFilePicker } = useFilesystem();

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
