import { Button } from "@/components/ui/button";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { LightbulbIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ExampleFileButton() {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );

  const handleClick = () => {
    openFileCreateDialog({ createExampleFile: true, createFirstTask: false });
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
