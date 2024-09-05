import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { ArchiveIcon, CircleHelpIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

export function ArchiveModeSelect() {
  const { t } = useTranslation();
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const setArchiveMode = useSettingsStore((state) => state.setArchiveMode);
  const { archiveTasks, selectedTaskLists, restoreArchivedTasks } = useTask();

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
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label>{t("Archiving")}</Label>
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
      <div className="flex gap-2">
        <Select value={archiveMode} onValueChange={handleChange}>
          <SelectTrigger aria-label="Select archive mode">
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
        {archiveMode === "manual" && selectedTaskLists.length && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="Archive now"
                onClick={archiveTasks}
              >
                <ArchiveIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent collisionPadding={10}>
              {t("Archive now")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
