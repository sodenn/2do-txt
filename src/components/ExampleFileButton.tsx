import { Button } from "@/components/ui/button";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import { LightbulbIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ExampleFileButton() {
  const { t } = useTranslation();
  const { showSaveFilePicker } = useFilePicker();
  const { createNewTodoFile } = useTask();

  const handleClick = async () => {
    const result = await showSaveFilePicker();
    if (!result) {
      return;
    }
    const content = await fetch("/todo.txt").then((r) => r.text());
    await createNewTodoFile(result.id, content);
  };

  return (
    <Button
      tabIndex={0}
      variant="outline"
      aria-label="Create example file"
      onClick={handleClick}
    >
      <LightbulbIcon className="mr-2 h-4 w-4" />
      {t("Create example file")}
    </Button>
  );
}
