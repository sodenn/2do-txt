import { Stack } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import { Task } from "../utils/task";
import {
  TimelineTask,
  useTaskGroups,
  useTimelineTasks,
} from "../utils/task-list";
import TaskList from "./TaskList";
import TaskTimeline from "./TaskTimeline";

const TaskView = () => {
  const { t } = useTranslation();
  const { taskView } = useSettings();
  const { taskLists, activeTaskList, deleteTask } = useTask();
  const { setTaskDialogOptions } = useTaskDialog();
  const { setConfirmationDialog } = useConfirmationDialog();
  const [focusedTaskId, setFocusedTaskId] = useState<string>();
  const listItemsRef = useRef<HTMLDivElement[]>([]);
  const taskGroups = useTaskGroups(taskLists, activeTaskList);
  const timelineTasks = useTimelineTasks(taskLists, activeTaskList);
  const tasks =
    taskView === "timeline"
      ? timelineTasks
      : taskGroups.flatMap((i) =>
          i.groups.reduce<Task[]>((prev, curr) => [...prev, ...curr.items], [])
        );

  useAddShortcutListener(() => focusNextListItem("down"), "ArrowDown", [
    tasks.length,
  ]);

  useAddShortcutListener(() => focusNextListItem("up"), "ArrowUp", [
    tasks.length,
  ]);

  useAddShortcutListener(
    () => {
      if (focusedTaskId) {
        const task = tasks.find((t) => t._id === focusedTaskId);
        if (task) {
          setTaskDialogOptions({ open: true, task });
        }
      }
    },
    "e",
    [listItemsRef.current.length]
  );

  useAddShortcutListener(
    () => {
      if (focusedTaskId) {
        const task = tasks.find((t) => t._id === focusedTaskId);
        if (task) {
          setConfirmationDialog({
            open: true,
            title: t("Delete task"),
            content: t("Are you sure you want to delete this task?"),
            buttons: [
              {
                text: t("Cancel"),
              },
              {
                text: t("Delete task"),
                handler: () => {
                  deleteTask(task);
                },
              },
            ],
          });
        }
      }
    },
    "d",
    [listItemsRef.current.length]
  );

  const focusNextListItem = (direction: "up" | "down") => {
    let index = 0;
    const task = tasks.find((t) => t._id === focusedTaskId);
    if (task) {
      index = tasks.indexOf(task);
      if (direction === "down") {
        index = index + 1 < tasks.length ? index + 1 : 0;
      } else {
        index = index - 1 >= 0 ? index - 1 : tasks.length - 1;
      }
    }
    listItemsRef.current[index].focus();
  };

  if (taskLists.length === 0) {
    return null;
  }

  return (
    <>
      {taskView === "list" && (
        <Stack spacing={1}>
          {taskGroups
            .filter((i) =>
              activeTaskList ? i.filePath === activeTaskList.filePath : i
            )
            .map((i, idx) => (
              <TaskList
                key={idx}
                fileName={i.fileName}
                filePath={i.filePath}
                taskGroups={i.groups}
                tasks={tasks}
                focusedTaskId={focusedTaskId}
                listItemsRef={listItemsRef}
                showHeader={!activeTaskList}
                onFocus={(index) => setFocusedTaskId(tasks[index]._id)}
                onBlur={() => setFocusedTaskId(undefined)}
              />
            ))}
        </Stack>
      )}
      {taskView === "timeline" && (
        <TaskTimeline
          tasks={tasks as TimelineTask[]}
          focusedTaskId={focusedTaskId}
          listItemsRef={listItemsRef}
          onFocus={(index) => setFocusedTaskId(tasks[index]._id)}
          onBlur={() => setFocusedTaskId(undefined)}
        />
      )}
    </>
  );
};

export default TaskView;
