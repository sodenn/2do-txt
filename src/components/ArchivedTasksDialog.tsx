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
import useArchivedTasksDialog from "../data/archived-tasks-dialog-store";
import { Task } from "../utils/task";
import useTask from "../utils/useTask";
import TaskBody from "./TaskBody";

const ArchivedTasksDialog = () => {
  const open = useArchivedTasksDialog((state) => state.open);
  const filePath = useArchivedTasksDialog((state) => state.filePath);
  const closeArchivedTasksDialog = useArchivedTasksDialog(
    (state) => state.closeArchivedTasksDialog
  );
  const cleanupArchivedTasksDialog = useArchivedTasksDialog(
    (state) => state.cleanupArchivedTasksDialog
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
          {tasks.map((task, index) => (
            <ListItem
              key={index}
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
};

export default ArchivedTasksDialog;
