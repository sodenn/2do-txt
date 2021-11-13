import { css } from "@emotion/css";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Theme,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { TaskFormData } from "../utils/task";
import TaskForm from "./TaskForm";

const initialTaskFormData: TaskFormData = {
  body: "",
  creationDate: undefined,
  completionDate: undefined,
};

export const dialogPaperStyle = (theme: Theme) => css`
  ${theme.breakpoints.down("sm")} {
    &.MuiPaper-root {
      margin: ${theme.spacing(2)};
      width: 100%;
    }
  }
`;

const TaskDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    openTaskDialog,
    taskDialogOpen,
    projects,
    contexts,
    fields,
    selectedTask,
    createCreationDate,
    addTask,
    editTask,
  } = useTask();
  const [formData, setFormData] = useState<TaskFormData>(initialTaskFormData);

  useEffect(() => {
    if (taskDialogOpen && selectedTask) {
      setFormData({
        _id: selectedTask._id,
        body: selectedTask.body,
        priority: selectedTask.priority,
        creationDate: selectedTask.creationDate,
        completionDate: selectedTask.completionDate,
        dueDate: selectedTask.dueDate,
      });
    } else if (taskDialogOpen) {
      const creationDate = createCreationDate ? new Date() : undefined;
      setFormData({ ...initialTaskFormData, creationDate });
    }
  }, [taskDialogOpen, selectedTask, createCreationDate]);

  const handleSave = () => {
    if (formData._id) {
      editTask(formData);
    } else {
      addTask(formData);
    }
    handleClose();
  };

  const handleClose = () => {
    openTaskDialog(false);
  };

  const handleChange = (data: TaskFormData) => {
    setFormData((task) => ({ ...task, ...data }));
  };

  return (
    <Dialog
      aria-label="Task dialog"
      fullWidth
      maxWidth="sm"
      open={taskDialogOpen}
      classes={{ paper: dialogPaperStyle(theme) }}
      onClose={(event, reason) =>
        reason !== "backdropClick" ? handleClose() : undefined
      }
    >
      <DialogTitle>
        {!!formData._id ? t("Edit Task") : t("Create Task")}
      </DialogTitle>
      <DialogContent>
        <TaskForm
          formData={formData}
          contexts={Object.keys(contexts)}
          projects={Object.keys(projects)}
          fields={fields}
          onChange={handleChange}
          onEnterPress={handleSave}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        <Button disabled={!formData.body} onClick={handleSave}>
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;
