import { Fade } from "@/components/Fade";
import { TaskForm } from "@/components/TaskForm";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogHiddenDescription,
  ResponsiveDialogHiddenTitle,
} from "@/components/ui/responsive-dialog";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { formatDate, todayDate } from "@/utils/date";
import { Task } from "@/utils/task";
import { TaskList } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import { TrashIcon, X } from "lucide-react";
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
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Cancel delete task"
            onClick={() => setShowDeleteConfirmButton(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            aria-label="Confirm delete"
            onClick={handleDelete}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            {t("Confirm")}
          </Button>
        </div>
      </Fade>
      <Fade
        duration={150}
        in={showDeleteButton}
        unmountOnExit
        onExited={() => setShowDeleteConfirmButton(true)}
      >
        <Button
          tabIndex={-1}
          variant="secondary"
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

  const handleOpen = () => {
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

  const handleExit = () => {
    cleanupTaskDialog();
    setValue(undefined);
    setEmptyBody(true);
    setSelectedTaskList(undefined);
  };

  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    if (document.querySelector(`[aria-label="Typeahead menu"]`)) {
      event.preventDefault();
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpen={handleOpen}
      onClose={closeTaskDialog}
      onExit={handleExit}
      disablePreventScroll
    >
      <ResponsiveDialogContent
        onEscapeKeyDown={handleEscapeKeyDown}
        data-testid="task-dialog"
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogHiddenTitle>
            {task?.id ? t("Edit Task") : t("Create Task")}
          </ResponsiveDialogHiddenTitle>
          <ResponsiveDialogHiddenDescription>
            {task?.id ? t("Edit Task") : t("Create Task")}
          </ResponsiveDialogHiddenDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <TaskForm
            value={value}
            contexts={contexts}
            projects={projects}
            tags={tags}
            taskLists={taskLists}
            onChange={handleChanged}
            onFileSelect={setSelectedTaskList}
            onEnterPress={handleSave}
          />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          {isNewTask && (
            <div className="flex-1">
              <DeleteTaskButton />
            </div>
          )}
          <ResponsiveDialogClose aria-label="Cancel">
            {t("Cancel")}
          </ResponsiveDialogClose>
          <Button
            aria-label="Save task"
            aria-disabled={formDisabled}
            disabled={formDisabled}
            onClick={handleSave}
          >
            {t("Save")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
