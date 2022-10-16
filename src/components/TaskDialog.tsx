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
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { formatDate, todayDate } from "../utils/date";
import { Task } from "../utils/task";
import { TaskList } from "../utils/task-list";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";
import TaskForm from "./TaskForm";

const rawText = (createCreationDate: boolean, task?: Task): string => {
  return task ? task.raw : createCreationDate ? formatDate(todayDate()) : "";
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
  const [raw, setRaw] = useState(rawText(createCreationDate, task));
  const [selectedTaskList, setSelectedTaskList] = useState<
    TaskList | undefined
  >();
  const [divider, setDivider] = useState(false);
  const formDisabled = !raw || (!activeTaskList && !selectedTaskList);
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
    if (task) {
      editTask({ raw, _id: task._id });
    } else if (selectedTaskList) {
      addTask({ raw }, selectedTaskList);
    }
  };

  const handleChange = (raw: string) => setRaw(raw);

  const handleFileSelect = (taskList?: TaskList) => {
    setSelectedTaskList(taskList);
  };

  const handleEnter = () => {
    setRaw(rawText(createCreationDate, task));
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
    setRaw(rawText(createCreationDate));
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
        raw={raw}
        newTask={!!task?._id}
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
          data-testid="task-dialog"
          maxWidth="sm"
          fullWidth
          open={open}
          onClose={handleClose}
          TransitionProps={TransitionProps}
        >
          <DialogTitle>
            {!!task?._id ? t("Edit Task") : t("Create Task")}
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
          data-testid="task-dialog"
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
            {!!task?._id ? t("Edit Task") : t("Create Task")}
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
