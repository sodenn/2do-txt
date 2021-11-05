import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  SlideProps,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { TaskFormData } from "../utils/task";
import TaskForm from "./TaskForm";

const initialTaskFormData: TaskFormData = {
  body: "",
  creationDate: undefined,
  completionDate: undefined,
};

const Transition = React.forwardRef<HTMLElement, SlideProps>((props, ref) => {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TaskDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.only("xs"));
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
      fullScreen={xs}
      PaperProps={
        xs
          ? {
              style: {
                backgroundImage: "unset",
              },
            }
          : {}
      }
      TransitionComponent={xs ? Transition : undefined}
      onClose={(event, reason) =>
        reason !== "backdropClick" ? handleClose() : undefined
      }
    >
      {xs && (
        <>
          <Toolbar color="transparent">
            <Typography sx={{ flex: 1 }} variant="subtitle1" component="div">
              {!!formData._id ? t("Edit Task") : t("Create Task")}
            </Typography>
            <Button color="primary" onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <Button color="primary" onClick={handleSave}>
              {t("Save")}
            </Button>
          </Toolbar>
          <Box sx={{ px: 2 }}>
            <TaskForm
              formData={formData}
              contexts={Object.keys(contexts)}
              projects={Object.keys(projects)}
              fields={fields}
              onChange={handleChange}
              onEnterPress={handleSave}
            />
          </Box>
        </>
      )}
      {!xs && (
        <>
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
            <Button onClick={handleSave}>{t("Save")}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default TaskDialog;
