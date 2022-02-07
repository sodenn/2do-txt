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
import { TaskListState, useTask } from "../data/TaskContext";
import { Task, TaskFormData } from "../utils/task";
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

const createFormData = (createCreationDate: boolean, activeTask?: Task) => {
  if (activeTask) {
    return {
      _id: activeTask._id,
      body: activeTask.body,
      priority: activeTask.priority,
      creationDate: activeTask.creationDate,
      completionDate: activeTask.completionDate,
      dueDate: activeTask.dueDate,
    };
  } else {
    const creationDate = createCreationDate ? new Date() : undefined;
    return { ...initialTaskFormData, creationDate };
  }
};

const TaskDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    openTaskDialog,
    taskDialogOpen,
    findTaskListByTaskId,
    taskLists,
    activeTask,
    activeTaskList,
    addTask,
    editTask,
    contexts: commonContexts,
    projects: commonProjects,
    tags: commonTags,
  } = useTask();
  const { createCreationDate } = useSettings();
  const [formData, setFormData] = useState<TaskFormData>(initialTaskFormData);
  const [selectedTaskList, setSelectedTaskList] = useState<
    TaskListState | undefined
  >(() => {
    if (activeTask) {
      return findTaskListByTaskId(activeTask._id);
    } else if (activeTaskList) {
      return activeTaskList;
    }
  });

  const formDisabled = !formData.body || (!activeTaskList && !selectedTaskList);
  const contexts = activeTaskList ? activeTaskList.contexts : commonContexts;
  const projects = activeTaskList ? activeTaskList.projects : commonProjects;
  const tags = activeTaskList ? activeTaskList.tags : commonTags;

  useEffect(() => {
    if (!taskDialogOpen) {
      return;
    }
    setFormData(createFormData(createCreationDate, activeTask));
    setSelectedTaskList(() => {
      if (activeTask) {
        return findTaskListByTaskId(activeTask._id);
      } else if (activeTaskList) {
        return activeTaskList;
      } else {
        return undefined;
      }
    });
  }, [
    createCreationDate,
    activeTask,
    taskDialogOpen,
    activeTaskList,
    findTaskListByTaskId,
  ]);

  const closeDialog = () => openTaskDialog(false);

  const handleSave = () => {
    closeDialog();
    if (formData._id) {
      editTask(formData);
    } else if (selectedTaskList) {
      addTask(formData, selectedTaskList);
    }
  };

  const handleChange = (data: TaskFormData) => {
    setFormData((task) => ({ ...task, ...data }));
  };

  const handleFileListChange = (taskList?: TaskListState) => {
    setSelectedTaskList(taskList);
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
          taskLists={activeTaskList || activeTask ? [] : taskLists}
          onChange={handleChange}
          onFileListChange={handleFileListChange}
          onEnterPress={handleSave}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>{t("Cancel")}</Button>
        <Button disabled={formDisabled} onClick={handleSave}>
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;
