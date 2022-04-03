import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../data/SettingsContext";
import { TaskListState, useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { Task, TaskFormData } from "../utils/task";
import { ResponsiveDialog } from "./ResponsiveDialog";
import { isMentionSuggestionsPopoverOpen } from "./TaskEditor";
import TaskForm from "./TaskForm";

const initialTaskFormData: TaskFormData = {
  body: "",
  creationDate: undefined,
  completionDate: undefined,
};

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
  const {
    findTaskListByTaskId,
    taskLists,
    activeTaskList,
    addTask,
    editTask,
    contexts: commonContexts,
    projects: commonProjects,
    tags: commonTags,
  } = useTask();
  const {
    taskDialogOptions: { open, task },
    setTaskDialogOptions,
  } = useTaskDialog();
  const { createCreationDate } = useSettings();
  const [formData, setFormData] = useState<TaskFormData>(initialTaskFormData);
  const [selectedTaskList, setSelectedTaskList] = useState<
    TaskListState | undefined
  >(() => {
    if (task) {
      return findTaskListByTaskId(task._id);
    } else if (activeTaskList) {
      return activeTaskList;
    }
  });

  const formDisabled = !formData.body || (!activeTaskList && !selectedTaskList);
  const contexts = activeTaskList ? activeTaskList.contexts : commonContexts;
  const projects = activeTaskList ? activeTaskList.projects : commonProjects;
  const tags = activeTaskList ? activeTaskList.tags : commonTags;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormData(createFormData(createCreationDate, task));
    setSelectedTaskList(() => {
      if (task) {
        return findTaskListByTaskId(task._id);
      } else if (activeTaskList) {
        return activeTaskList;
      } else {
        return undefined;
      }
    });
  }, [createCreationDate, task, open, activeTaskList, findTaskListByTaskId]);

  const closeDialog = () =>
    setTaskDialogOptions((currentValue) => ({ ...currentValue, open: false }));

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

  const handleFileSelect = (taskList?: TaskListState) => {
    setSelectedTaskList(taskList);
  };

  const handleClose = (
    event: any,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    return reason !== "backdropClick" && !isMentionSuggestionsPopoverOpen()
      ? closeDialog()
      : undefined;
  };

  return (
    <ResponsiveDialog
      aria-label="Task dialog"
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionProps={{
        onExited: () => setTaskDialogOptions({ open: false }),
      }}
    >
      <DialogTitle>
        {!!formData._id ? t("Edit Task") : t("Create Task")}
      </DialogTitle>
      <DialogContent>
        <TaskForm
          completed={!!task?.completed}
          formData={formData}
          contexts={Object.keys(contexts)}
          projects={Object.keys(projects)}
          tags={tags}
          taskLists={activeTaskList || task ? [] : taskLists}
          onChange={handleChange}
          onFileSelect={handleFileSelect}
          onEnterPress={handleSave}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>{t("Cancel")}</Button>
        <Button
          aria-label="Save task"
          disabled={formDisabled}
          onClick={handleSave}
        >
          {t("Save")}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default TaskDialog;
