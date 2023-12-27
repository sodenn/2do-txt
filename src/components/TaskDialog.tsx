import { Fade } from "@/components/Fade";
import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogButton,
  ResponsiveDialogContent,
  ResponsiveDialogSecondaryActions,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { TaskForm } from "@/components/TaskForm";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { formatDate, todayDate } from "@/utils/date";
import { Task } from "@/utils/task";
import { TaskList } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Button, Stack } from "@mui/joy";
import { ModalProps } from "@mui/joy/Modal";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function getValue(createCreationDate: boolean, task?: Task) {
  return task ? task.raw : createCreationDate ? formatDate(todayDate()) : "";
}

function DeleteTaskButton() {
  const { t } = useTranslation();
  const [showDeleteButton, setShowDeleteButton] = useState(true);
  const [showDeleteConfirmButton, setShowDeleteConfirmButton] = useState(false);
  const closeTaskDialog = useTaskDialogStore((state) => state.closeTaskDialog);
  const task = useTaskDialogStore((state) => state.task);
  const { deleteTask } = useTask();

  const handleDelete = useCallback(() => {
    if (task) {
      deleteTask(task);
    }
    closeTaskDialog();
  }, [closeTaskDialog, deleteTask, task]);

  return (
    <>
      <Fade
        duration={150}
        in={showDeleteConfirmButton}
        unmountOnExit
        onExited={() => setShowDeleteButton(true)}
      >
        <Stack spacing={1} direction="row">
          <Button
            variant="soft"
            color="neutral"
            aria-label="Cancel delete task"
            onClick={() => setShowDeleteConfirmButton(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="soft"
            color="danger"
            startDecorator={<DeleteForeverIcon />}
            aria-label="Confirm delete"
            onClick={handleDelete}
          >
            {t("Confirm")}
          </Button>
        </Stack>
      </Fade>
      <Fade
        duration={150}
        in={showDeleteButton}
        unmountOnExit
        onExited={() => setShowDeleteConfirmButton(true)}
      >
        <Button
          variant="soft"
          color="danger"
          aria-label="Delete task"
          onClick={() => setShowDeleteButton(false)}
        >
          {t("Delete")}
        </Button>
      </Fade>
    </>
  );
}

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
  const createCreationDate = useSettingsStore(
    (state) => state.createCreationDate,
  );
  const [value, setValue] = useState<string>();
  const [selectedTaskList, setSelectedTaskList] = useState<
    TaskList | undefined
  >();
  const [emptyBody, setEmptyBody] = useState(true);
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
  const formDisabled = useMemo(
    () => (!task && !selectedTaskList) || !emptyBody,
    [task, selectedTaskList, emptyBody],
  );
  const isNewTask = !!task?.id;

  const handleSave = useCallback(() => {
    if (formDisabled || !value) {
      return;
    }
    closeTaskDialog();
    if (task) {
      editTask({ text: value, id: task.id });
    } else if (selectedTaskList) {
      addTask(value, selectedTaskList);
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

  const handleChanged = useCallback((value: string, emptyBody: boolean) => {
    setValue(value);
    setEmptyBody(emptyBody);
  }, []);

  const handleClose = useCallback<NonNullable<ModalProps["onClose"]>>(
    (_, reason) => {
      return reason !== "backdropClick" ? closeTaskDialog() : undefined;
    },
    [closeTaskDialog],
  );

  const handleEnter = () => {
    const value = getValue(createCreationDate, task);
    setValue(value);
    setEmptyBody(!!task && !!task.body);
    setSelectedTaskList(() => {
      if (task) {
        return findTaskListByTaskId(task.id);
      } else if (activeTaskList) {
        return activeTaskList;
      }
    });
  };

  const handleExited = () => {
    cleanupTaskDialog();
    setValue(undefined);
    setEmptyBody(true);
    setSelectedTaskList(undefined);
  };

  return (
    <ResponsiveDialog
      data-testid="task-dialog"
      fullWidth
      open={open}
      onClose={handleClose}
      onEnter={handleEnter}
      onExited={handleExited}
    >
      <ResponsiveDialogTitle>
        {task?.id ? t("Edit Task") : t("Create Task")}
      </ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <TaskForm
          value={value}
          newTask={isNewTask}
          contexts={contexts}
          projects={projects}
          tags={tags}
          taskLists={taskLists}
          onChange={handleChanged}
          onFileSelect={setSelectedTaskList}
          onEnterPress={handleSave}
        />
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <ResponsiveDialogButton
          aria-label="Save task"
          aria-disabled={formDisabled}
          disabled={formDisabled}
          onClick={handleSave}
        >
          {t("Save")}
        </ResponsiveDialogButton>
      </ResponsiveDialogActions>
      {isNewTask && (
        <ResponsiveDialogSecondaryActions>
          <DeleteTaskButton />
        </ResponsiveDialogSecondaryActions>
      )}
    </ResponsiveDialog>
  );
}
