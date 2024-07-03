import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArchiveMode, useSettingsStore } from "@/stores/settings-store";
import { useTask } from "@/utils/useTask";
import { CircleHelpIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

export function ArchiveModeSelect() {
  const { t } = useTranslation();
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const setArchiveMode = useSettingsStore((state) => state.setArchiveMode);
  const { archiveTasks, restoreArchivedTasks } = useTask();

  const handleChange = (value: ArchiveMode) => {
    const newValue = value || "no-archiving";
    setArchiveMode(newValue);
    if (newValue === "automatic") {
      archiveTasks();
    } else if (newValue === "no-archiving") {
      restoreArchivedTasks();
    }
  };

  return (
    <div className="space-y-1">
      <div className="space-y-2">
        <div className="flex items-center gap-1 font-semibold">
          {t("Archiving")}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <CircleHelpIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent
              collisionPadding={10}
              className="max-w-[250px]"
              asChild
            >
              <div>
                <Trans i18nKey="Completed tasks are archived in a second file called done.txt" />
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={archiveMode}
          onValueChange={handleChange}
          aria-label="Select archive mode"
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-archiving" aria-label="No archiving">
              {t("No archiving")}
            </SelectItem>
            <SelectItem value="manual" aria-label="Archive manually">
              {t("Archive manually")}
            </SelectItem>
            <SelectItem value="automatic" aria-label="Archive automatically">
              {t("Archive automatically")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {archiveMode === "manual" && (
        <Button
          variant="outline"
          aria-label="Archive now"
          onClick={archiveTasks}
        >
          {t("Archive now")}
        </Button>
      )}
    </div>
  );
}
