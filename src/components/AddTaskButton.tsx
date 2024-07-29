import { Kbd } from "@/components/Kbd";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AddTaskButton() {
  const { t } = useTranslation();
  const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);

  const handleClick = () => openTaskDialog();

  useHotkeys({ n: () => openTaskDialog() });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          tabIndex={-1}
          aria-label="Add task"
          size="icon"
          onClick={handleClick}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent collisionPadding={15}>
        {t("Create Task")}
        <Kbd>N</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
