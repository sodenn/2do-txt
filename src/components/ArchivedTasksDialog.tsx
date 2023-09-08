import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { TaskBody } from "@/components/TaskBody";
import { useArchivedTasksDialogStore } from "@/stores/archived-tasks-dialog-store";
import { Task } from "@/utils/task";
import { useTask } from "@/utils/useTask";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import { IconButton, List, ListItem, Tooltip } from "@mui/joy";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ArchivedTasksDialog() {
  const open = useArchivedTasksDialogStore((state) => state.open);
  const filePath = useArchivedTasksDialogStore((state) => state.filePath);
  const closeArchivedTasksDialog = useArchivedTasksDialogStore(
    (state) => state.closeArchivedTasksDialog,
  );
  const cleanupArchivedTasksDialog = useArchivedTasksDialogStore(
    (state) => state.cleanupArchivedTasksDialog,
  );
  const { t } = useTranslation();
  const { loadDoneFile, restoreTask } = useTask();
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleRestore = async (task: Task) => {
    if (filePath) {
      await restoreTask(filePath, task);
      loadDoneFile(filePath).then((result) => {
        if (result && result.items.length > 0) {
          setTasks(result.items);
        } else {
          closeArchivedTasksDialog();
        }
      });
    }
  };

  useEffect(() => {
    if (filePath) {
      loadDoneFile(filePath).then((result) => {
        if (result) {
          setTasks(result.items);
        }
      });
    }
  }, [filePath, loadDoneFile]);

  return (
    <ResponsiveDialog
      fullWidth
      open={open}
      onClose={closeArchivedTasksDialog}
      onExited={cleanupArchivedTasksDialog}
    >
      <ResponsiveDialogTitle>{t("Archived tasks")}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <List size="sm">
          {tasks.map((task) => (
            <ListItem
              key={task._id}
              endAction={
                <Tooltip title={t("Restore task")}>
                  <IconButton
                    onClick={() => handleRestore(task)}
                    aria-label="restore"
                  >
                    <RestoreOutlinedIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <TaskBody task={task} />
            </ListItem>
          ))}
        </List>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
