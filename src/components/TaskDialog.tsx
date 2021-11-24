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
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { TaskFormData } from "../utils/task";
import { isSuggestionsPopupOpen } from "./TaskEditor";
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
    tags,
    selectedTask,
    addTask,
    editTask,
  } = useTask();
  const { createCreationDate } = useSettings();
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

  const closeDialog = () => openTaskDialog(false);

  const handleSave = () => {
    if (formData._id) {
      editTask(formData);
    } else {
      addTask(formData);
    }
    closeDialog();
  };

  const handleChange = (data: TaskFormData) => {
    setFormData((task) => ({ ...task, ...data }));
  };

  const handleClose = (
    event: any,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    return reason !== "backdropClick" && !isSuggestionsPopupOpen()
      ? closeDialog()
      : undefined;
  };

  return (
    <Dialog
      aria-label="Task dialog"
      fullWidth
      maxWidth="sm"
      open={taskDialogOpen}
      classes={{ paper: dialogPaperStyle(theme) }}
      onClose={handleClose}
    >
      <DialogTitle>
        {!!formData._id ? t("Edit Task") : t("Create Task")}
      </DialogTitle>
      <DialogContent>
        <TaskForm
          formData={formData}
          contexts={Object.keys(contexts)}
          projects={Object.keys(projects)}
          tags={tags}
          onChange={handleChange}
          onEnterPress={handleSave}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>{t("Cancel")}</Button>
        <Button disabled={!formData.body} onClick={handleSave}>
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;
