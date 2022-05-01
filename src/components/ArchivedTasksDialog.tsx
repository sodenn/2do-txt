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
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useArchivedTasksDialog } from "../data/ArchivedTasksDialogContext";
import { useTask } from "../data/TaskContext";
import { Task } from "../utils/task";
import TaskBody from "./TaskBody";

const ArchivedTasksDialog = () => {
  const {
    archivedTasksDialog: { open, filePath },
    setArchivedTasksDialog,
  } = useArchivedTasksDialog();
  const { t } = useTranslation();
  const { loadDoneFile, restoreTask } = useTask();
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleClose = () =>
    setArchivedTasksDialog((currentValue) => ({
      ...currentValue,
      open: false,
    }));

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
      aria-label="Archived tasks dialog"
      maxWidth="sm"
      scroll="paper"
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: () => setArchivedTasksDialog({ open: false }),
      }}
    >
      <DialogTitle>{t("Archived tasks")}</DialogTitle>
      <DialogContent dividers>
        <List dense>
          {tasks.map((task, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <Tooltip
                  disableTouchListener
                  title={t("Restore task") as string}
                >
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
