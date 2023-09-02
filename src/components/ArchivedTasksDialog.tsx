import { TaskBody } from "@/components/TaskBody";
import { useArchivedTasksDialogStore } from "@/stores/archived-tasks-dialog-store";
import { Task } from "@/utils/task";
import { useTask } from "@/utils/useTask";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
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

  const handleClose = () => closeArchivedTasksDialog();

  const handleRestore = async (task: Task) => {
    if (filePath) {
      await restoreTask(filePath, task);
      loadDoneFile(filePath).then((result) => {
        if (result && result.items.length > 0) {
          setTasks(result.items);
        } else {
          handleClose();
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
    <Dialog
      maxWidth="sm"
      scroll="paper"
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: cleanupArchivedTasksDialog,
      }}
    >
      <DialogTitle>{t("Archived tasks")}</DialogTitle>
      <DialogContent dividers>
        <List dense>
          {tasks.map((task) => (
            <ListItem
              key={task._id}
              secondaryAction={
                <Tooltip title={t("Restore task")}>
                  <IconButton
                    onClick={() => handleRestore(task)}
                    edge="end"
                    aria-label="restore"
                  >
                    <RestoreOutlinedIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText primary={<TaskBody task={task} />} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
