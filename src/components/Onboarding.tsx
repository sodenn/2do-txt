import { CloudStorageOnboarding } from "@/components/CloudStorageOnboarding";
import { ExampleFileButton } from "@/components/ExampleFileButton";
import { NewFileButton } from "@/components/NewFileButton";
import { Button } from "@/components/ui/button";
import logo from "@/images/logo.png";
import { usePlatformStore } from "@/stores/platform-store";
import { cn } from "@/utils/tw-utils";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import { FolderIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Onboarding() {
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { taskLists } = useTask();
  const { openFileDialog } = useFilePicker();

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
          className="mb-3 text-center text-xl font-semibold tracking-tight"
          role="heading"
          aria-label="Onboarding"
        >
          {t("Get Started")}
        </h1>
        <NewFileButton />
        <ExampleFileButton />
        <Button
          variant="outline"
          onClick={openFileDialog}
          aria-label={
            platform === "desktop" ? "Open todo.txt" : "Import todo.txt"
          }
        >
          <FolderIcon className="mr-2 h-4 w-4" />
          {platform === "desktop" ? t("Open todo.txt") : t("Import todo.txt")}
        </Button>
        <CloudStorageOnboarding />
      </div>
    </div>
  );
}
