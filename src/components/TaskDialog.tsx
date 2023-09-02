import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogTitle,
} from "@/components/FullScreenDialog";
import { TaskForm } from "@/components/TaskForm";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { formatDate, todayDate } from "@/utils/date";
import { Task } from "@/utils/task";
import { TaskList } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const rawText = (createCreationDate: boolean, task?: Task): string => {
  return task ? task.raw : createCreationDate ? formatDate(todayDate()) : "";
};

export function TaskDialog() {
  const { t } = useTranslation();
  const {
    findTaskListByTaskId,
    taskLists: _taskLists,
    activeTaskList,
    addTask,
    editTask,
    contexts: commonContexts,
    projects: commonProjects,
    tags: commonTags,
  } = useTask();
  const closeTaskDialog = useTaskDialogStore((state) => state.closeTaskDialog);
  const cleanupTaskDialog = useTaskDialogStore(
    (state) => state.cleanupTaskDialog,
  );
  const open = useTaskDialogStore((state) => state.open);
  const task = useTaskDialogStore((state) => state.task);
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const createCreationDate = useSettingsStore(
    (state) => state.createCreationDate,
  );
  const [value, setValue] = useState<string>();
  const [selectedTaskList, setSelectedTaskList] = useState<
    TaskList | undefined
  >();
  const formDisabled = !value || (!activeTaskList && !selectedTaskList);
  const contexts = useMemo(
    () =>
      Object.keys(activeTaskList ? activeTaskList.contexts : commonContexts),
    [activeTaskList, commonContexts],
  );
  const projects = useMemo(
    () =>
      Object.keys(activeTaskList ? activeTaskList.projects : commonProjects),
    [activeTaskList, commonProjects],
  );
  const tags = activeTaskList ? activeTaskList.tags : commonTags;
  const taskLists = useMemo(
    () => (activeTaskList || task ? [] : _taskLists),
    [_taskLists, activeTaskList, task],
  );

  const handleSave = useCallback(() => {
    if (formDisabled) {
      return;
    }
    closeTaskDialog();
    if (task) {
      editTask({ raw: value, _id: task._id });
    } else if (selectedTaskList) {
      addTask({ raw: value }, selectedTaskList);
    }
  }, [
    addTask,
    closeTaskDialog,
    editTask,
    formDisabled,
    value,
    selectedTaskList,
    task,
  ]);

  const handleClose = useCallback(
    (event: any, reason: "backdropClick" | "escapeKeyDown") => {
      return reason !== "backdropClick" ? closeTaskDialog() : undefined;
    },
    [closeTaskDialog],
  );

  const handleEnter = () => {
    setValue(rawText(createCreationDate, task));
    setSelectedTaskList(() => {
      if (task) {
        return findTaskListByTaskId(task._id);
      } else if (activeTaskList) {
        return activeTaskList;
      }
    });
  };

  const handleExit = () => {
    cleanupTaskDialog();
    setValue(undefined);
    setSelectedTaskList(undefined);
  };

  const TransitionProps = {
    onEnter: handleEnter,
    onExited: handleExit,
  };

  const taskForm = value ? (
    <TaskForm
      value={value}
      newTask={!!task?._id}
      contexts={contexts}
      projects={projects}
      tags={tags}
      taskLists={taskLists}
      onChange={setValue}
      onFileSelect={setSelectedTaskList}
      onEnterPress={handleSave}
    />
  ) : null;

  if (fullScreenDialog) {
    return (
      <FullScreenDialog
        data-testid="task-dialog"
        open={open}
        onClose={closeTaskDialog}
        TransitionProps={TransitionProps}
      >
        <FullScreenDialogTitle
          onClose={closeTaskDialog}
          accept={{
            text: t("Save"),
            disabled: formDisabled,
            onClick: handleSave,
            "aria-label": "Save task",
          }}
        >
          {task?._id ? t("Edit Task") : t("Create Task")}
        </FullScreenDialogTitle>
        <FullScreenDialogContent>{taskForm}</FullScreenDialogContent>
      </FullScreenDialog>
    );
  }

  return (
    <Dialog
      data-testid="task-dialog"
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionProps={TransitionProps}
    >
      <DialogTitle>{task?._id ? t("Edit Task") : t("Create Task")}</DialogTitle>
      <DialogContent>{taskForm}</DialogContent>
      <DialogActions>
        <Button tabIndex={-1} onClick={closeTaskDialog}>
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
  );
}
