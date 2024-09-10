import { ExampleListButton } from "@/components/ExampleListButton";
import { NewFileButton } from "@/components/NewFileButton";
import { Button } from "@/components/ui/button";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { cn } from "@/utils/tw-utils";
import { useFilesystem } from "@/utils/useFilesystem";
import { useTask } from "@/utils/useTask";
import { FolderIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "/logo.png";

export function Onboarding() {
  const { t } = useTranslation();
  const { taskLists, addTodoFile } = useTask();
  const { showOpenFilePicker } = useFilesystem();

  const handleOpenClick = async () => {
    const result = await showOpenFilePicker();
    if (result) {
      addTodoFile(result.id, result.filename, result.content);
    }
  };

  return (
    <div
      className={cn(
        "flex justify-center sm:pb-5 sm:pt-10",
        taskLists.length > 0 && "hidden",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-center py-1">
          <img
            src={logo}
            draggable={false}
            alt="Logo"
            style={{ opacity: 0.2 }}
            className="h-24 w-24"
          />
        </div>
        <h1
          className="mb-3 text-center text-2xl font-bold tracking-tight"
          role="heading"
          aria-label="Onboarding"
        >
          {t("Get Started")}
        </h1>
        <NewFileButton />
        <ExampleListButton />
        <Button
          variant="outline"
          onClick={handleOpenClick}
          aria-label={
            SUPPORTS_SHOW_OPEN_FILE_PICKER ? "Open list" : "Import list"
          }
        >
          <FolderIcon className="mr-2 h-4 w-4" />
          {SUPPORTS_SHOW_OPEN_FILE_PICKER ? t("Open list") : t("Import list")}
        </Button>
      </div>
    </div>
  );
}
