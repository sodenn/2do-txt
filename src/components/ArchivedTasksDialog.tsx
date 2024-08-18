import { TaskBody } from "@/components/TaskBody";
import { Button } from "@/components/ui/button";
import { List, ListItem } from "@/components/ui/list";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogHiddenDescription,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useArchivedTasksDialogStore } from "@/stores/archived-tasks-dialog-store";
import { Task } from "@/utils/task";
import { useTask } from "@/utils/useTask";
import { ArchiveRestoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ArchivedTasksDialog() {
  const {
    open,
    todoFileId,
    closeArchivedTasksDialog,
    cleanupArchivedTasksDialog,
  } = useArchivedTasksDialogStore();
  const { t } = useTranslation();
  const { loadDoneFile, restoreTask } = useTask();
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleRestore = async (task: Task) => {
    if (todoFileId) {
      await restoreTask(todoFileId, task);
      loadDoneFile(todoFileId).then((result) => {
        if (result && result.items.length > 0) {
          setTasks(result.items);
        } else {
          closeArchivedTasksDialog();
        }
      });
    }
  };

  useEffect(() => {
    if (todoFileId) {
      loadDoneFile(todoFileId).then((result) => {
        if (result) {
          setTasks(result.items);
        }
      });
    }
  }, [todoFileId, loadDoneFile]);

  return (
    <ResponsiveDialog
      open={open}
      onClose={closeArchivedTasksDialog}
      onExit={cleanupArchivedTasksDialog}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("Archived tasks")}</ResponsiveDialogTitle>
          <ResponsiveDialogHiddenDescription>
            Archived tasks
          </ResponsiveDialogHiddenDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <List className="text-sm">
            {tasks.map((task) => (
              <ListItem key={task.id} className="cursor-auto">
                <TaskBody task={task} />
                <div className="flex-1" />
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRestore(task)}
                      aria-label="restore"
                      className="shrink-0"
                    >
                      <ArchiveRestoreIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Restore task")}</TooltipContent>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
