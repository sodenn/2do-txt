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
  const { taskLists, addTodoFile, todoFiles, resumeSession } = useTask();
  const { showOpenFilePicker } = useFilesystem();

  const handleOpenClick = async () => {
    const result = await showOpenFilePicker();
    if (result) {
      addTodoFile(result.id, result.filename, result.content);
    }
  };

  const filesRequiringPermission = todoFiles?.errors.filter(
    (error) => error.permissionRequired,
  );

  return (
    <div
      className={cn(
        "flex justify-center sm:pt-10 sm:pb-5",
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

        {filesRequiringPermission && filesRequiringPermission.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="text-center text-sm text-muted-foreground">
              {t("Resume previous session")}
            </div>
            {filesRequiringPermission.map((file) => (
              <Button
                key={file.id}
                variant="secondary"
                onClick={async () => {
                  // Trigger the same logic as the toast "Yes" action
                  // We need to import loadTodoFileFromDisk and scheduleDueTaskNotifications or expose a method from useTask
                  // Since those are not easily exposed, we can rely on the fact that clicking this will likely trigger the browser's permission prompt
                  // if we re-attempt to read the file.
                  // Actually, useTask's handleInit already tries to read and fails.
                  // We need to manually trigger the load again.
                  // Let's use a new function in useTask or just import the utils here if possible.
                  // But useTask has the state updater `addTaskList`.
                  // I should probably expose a `resumeFile` function in useTask.
                }}
              >
                {t("Resume")} {file.filename}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
