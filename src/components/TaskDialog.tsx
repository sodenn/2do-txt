import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { TaskForm } from "@/components/TaskForm";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { formatDate, todayDate } from "@/utils/date";
import { Task } from "@/utils/task";
import { TaskList } from "@/utils/task-list";
import { useDialogButtonSize } from "@/utils/useDialogButtonSize";
import { useTask } from "@/utils/useTask";
import { Button } from "@mui/joy";
import { ModalProps } from "@mui/joy/Modal";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function rawText(createCreationDate: boolean, task?: Task) {
  return task ? task.raw : createCreationDate ? formatDate(todayDate()) : "";
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
  const buttonSize = useDialogButtonSize();
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
  const [formDisabled, setFormDisabled] = useState(true);
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
    if (formDisabled || !value) {
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

  const handleChanged = useCallback((value: string, emptyBody: boolean) => {
    setValue(value);
    setFormDisabled(!emptyBody);
  }, []);

  const handleClose = useCallback<NonNullable<ModalProps["onClose"]>>(
    (_, reason) => {
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

  const handleExited = () => {
    cleanupTaskDialog();
    setFormDisabled(true);
    setValue(undefined);
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
        {task?._id ? t("Edit Task") : t("Create Task")}
      </ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        {value && (
          <TaskForm
            value={value}
            newTask={!!task?._id}
            contexts={contexts}
            projects={projects}
            tags={tags}
            taskLists={taskLists}
            onChange={handleChanged}
            onFileSelect={setSelectedTaskList}
            onEnterPress={handleSave}
          />
        )}
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <Button
          size={buttonSize}
          aria-label="Save task"
          aria-disabled={formDisabled}
          disabled={formDisabled}
          onClick={handleSave}
        >
          {t("Save")}
        </Button>
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  );
}
