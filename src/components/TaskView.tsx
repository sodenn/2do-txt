import { TaskList } from "@/components/TaskList";
import { TaskTimeline } from "@/components/TaskTimeline";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { Task } from "@/utils/task";
import {
  TimelineTask,
  useTaskGroups,
  useTimelineTasks,
} from "@/utils/task-list";
import { useHotkeys } from "@/utils/useHotkeys";
import { useTask } from "@/utils/useTask";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function TaskView() {
  const { t } = useTranslation();
  const taskView = useSettingsStore((state) => state.taskView);
  const { taskLists, activeTaskList, deleteTask } = useTask();
  const _openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );
  const [focusedTaskId, setFocusedTaskId] = useState<string>();
  const listItemsRef = useRef<HTMLDivElement[]>([]);
  const taskGroups = useTaskGroups(taskLists, activeTaskList);
  const timelineTasks = useTimelineTasks(taskLists, activeTaskList);
  const tasks =
    taskView === "timeline"
      ? timelineTasks
      : taskGroups.flatMap((i) =>
          i.groups.reduce<Task[]>((prev, curr) => [...prev, ...curr.items], []),
        );

  const focusNextListItem = useCallback(
    (direction: "up" | "down") => {
      let index = 0;
      let length = tasks.length;
      const task = tasks.find((t) => t.id === focusedTaskId);
      if (task) {
        index = tasks.indexOf(task);
        const notFocusablePredecessor = tasks.some(
          (t, idx) => t.id === "-1" && idx < index,
        );
        if (notFocusablePredecessor) {
          index = index - 1;
          length = length - 1;
        }
        if (direction === "down") {
          index = index + 1 < length ? index + 1 : 0;
        } else {
          index = index - 1 >= 0 ? index - 1 : listItemsRef.current.length - 1;
        }
      }
      listItemsRef.current[index].focus();
    },
    [focusedTaskId, tasks],
  );

  const openTaskDialog = useCallback(() => {
    if (focusedTaskId) {
      const task = tasks.find((t) => t.id === focusedTaskId);
      if (task) {
        _openTaskDialog(task);
      }
    }
  }, [focusedTaskId, _openTaskDialog, tasks]);

  const openDeleteTaskDialog = useCallback(() => {
    if (focusedTaskId) {
      const task = tasks.find((t) => t.id === focusedTaskId);
      if (task) {
        openConfirmationDialog({
          title: t("Delete task"),
          content: t("Are you sure you want to delete this task?"),
          buttons: [
            {
              text: t("Delete"),
              color: "danger",
              handler: () => {
                deleteTask(task);
              },
            },
          ],
        });
      }
    }
  }, [deleteTask, focusedTaskId, openConfirmationDialog, t, tasks]);

  useHotkeys(
    taskLists.length === 0
      ? {}
      : {
          ArrowUp: () => focusNextListItem("up"),
          ArrowDown: () => focusNextListItem("down"),
          e: openTaskDialog,
          d: openDeleteTaskDialog,
        },
  );

  if (taskLists.length === 0) {
    return null;
  }

  return (
    <>
      {taskView === "list" &&
        taskGroups
          .filter((i) =>
            activeTaskList ? i.filePath === activeTaskList.filePath : i,
          )
          .map((i) => (
            <TaskList
              key={i.filePath}
              fileName={i.fileName}
              filePath={i.filePath}
              taskGroups={i.groups}
              tasks={tasks}
              listItemsRef={listItemsRef}
              showHeader={!activeTaskList}
              onFocus={(index) => setFocusedTaskId(tasks[index].id)}
              onBlur={() => setFocusedTaskId(undefined)}
              onClick={(task) => _openTaskDialog(task)}
            />
          ))}
      {taskView === "timeline" && (
        <TaskTimeline
          tasks={tasks as TimelineTask[]}
          focusedTaskId={focusedTaskId}
          listItemsRef={listItemsRef}
          onFocus={(index) => setFocusedTaskId(tasks[index].id)}
          onBlur={() => setFocusedTaskId(undefined)}
          onListItemClick={(task) => _openTaskDialog(task)}
        />
      )}
    </>
  );
}
