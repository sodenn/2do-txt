import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FluentEditProvider } from "@react-fluent-edit/core";
import { MentionsProvider } from "@react-fluent-edit/mentions";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../data/SettingsContext";
import { TaskList, useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { Task, TaskFormData } from "../utils/task";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";
import TaskForm from "./TaskForm";

const initialTaskFormData: TaskFormData = {
  body: "",
  creationDate: undefined,
  completionDate: undefined,
};

const createFormData = (
  createCreationDate: boolean,
  activeTask?: Task
): TaskFormData => {
  if (activeTask) {
    return {
      _id: activeTask._id,
      body: activeTask.body,
      priority: activeTask.priority,
      creationDate: activeTask.creationDate,
      completionDate: activeTask.completionDate,
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
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const { createCreationDate } = useSettings();
  const [key, setKey] = useState(0);
  const [formData, setFormData] = useState<TaskFormData>(initialTaskFormData);
  const [selectedTaskList, setSelectedTaskList] = useState<
    TaskList | undefined
  >();
  const [divider, setDivider] = useState(false);
  const formDisabled = !formData.body || (!activeTaskList && !selectedTaskList);
  const contexts = activeTaskList ? activeTaskList.contexts : commonContexts;
  const projects = activeTaskList ? activeTaskList.projects : commonProjects;
  const tags = activeTaskList ? activeTaskList.tags : commonTags;

  const closeDialog = () =>
    setTaskDialogOptions((value) => ({ ...value, open: false }));

  const handleSave = () => {
    if (formDisabled) {
      return;
    }
    closeDialog();
    if (formData._id) {
      editTask(formData);
    } else if (selectedTaskList) {
      addTask(formData, selectedTaskList);
    }
  };

  const handleChange = (data: TaskFormData) => {
    setFormData((currentValue) => ({ ...currentValue, ...data }));
  };

  const handleFileSelect = (taskList?: TaskList) => {
    setSelectedTaskList(taskList);
  };

  const handleEnter = () => {
    setFormData(createFormData(createCreationDate, task));
    setSelectedTaskList(() => {
      if (task) {
        return findTaskListByTaskId(task._id);
      } else if (activeTaskList) {
        return activeTaskList;
      }
    });
    setKey(key + 1);
  };

  const handleExit = () => {
    setTaskDialogOptions({ open: false });
    setFormData(createFormData(createCreationDate));
    setSelectedTaskList(undefined);
  };

  const handleClose = (
    event: any,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    return reason !== "backdropClick" ? closeDialog() : undefined;
  };

  const TransitionProps = {
    onEnter: handleEnter,
    onExited: handleExit,
  };

  const taskForm = (
    <FluentEditProvider providers={[<MentionsProvider />]}>
      <TaskForm
        key={key}
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
    </FluentEditProvider>
  );

  return (
    <>
      {!fullScreenDialog && (
        <Dialog
          aria-label="Task dialog"
          maxWidth="sm"
          fullWidth
          open={open}
          onClose={handleClose}
          TransitionProps={TransitionProps}
        >
          <DialogTitle>
            {!!formData._id ? t("Edit Task") : t("Create Task")}
          </DialogTitle>
          <DialogContent>{taskForm}</DialogContent>
          <DialogActions>
            <Button tabIndex={-1} onClick={closeDialog}>
              {t("Cancel")}
            </Button>
            <Button
              aria-label="Save task"
              disabled={formDisabled}
              onClick={handleSave}
            >
              {t("Save")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {fullScreenDialog && (
        <FullScreenDialog
          aria-label="Task dialog"
          open={open}
          onClose={closeDialog}
          TransitionProps={TransitionProps}
        >
          <FullScreenDialogTitle
            divider={divider}
            onClose={closeDialog}
            accept={{
              text: t("Save"),
              disabled: formDisabled,
              onClick: handleSave,
              "aria-label": "Save task",
            }}
          >
            {!!formData._id ? t("Edit Task") : t("Create Task")}
          </FullScreenDialogTitle>
          <FullScreenDialogContent onScroll={(top) => setDivider(top > 12)}>
            {taskForm}
          </FullScreenDialogContent>
        </FullScreenDialog>
      )}
    </>
  );
};

export default TaskDialog;
