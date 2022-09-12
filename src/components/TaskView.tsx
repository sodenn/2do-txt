import { Stack } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import { Task } from "../utils/task";
import { useTaskGroups, useTimelineTasks } from "../utils/task-list";
import TaskList from "./TaskList";
import TaskTimeline from "./TaskTimeline";

const TaskView = () => {
  const { t } = useTranslation();
  const { taskView } = useSettings();
  const { activeTaskList, deleteTask } = useTask();
  const { setTaskDialogOptions } = useTaskDialog();
  const { setConfirmationDialog } = useConfirmationDialog();
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1);
  const listItemsRef = useRef<HTMLDivElement[]>([]);
  const taskGroups = useTaskGroups();
  const timelineTasks = useTimelineTasks();
  const taskList =
    taskView === "timeline"
      ? timelineTasks
      : taskGroups.flatMap((i) =>
          i.groups.reduce<Task[]>((prev, curr) => [...prev, ...curr.items], [])
        );

  useAddShortcutListener(() => focusNextListItem("down"), "ArrowDown", [
    taskList.length,
  ]);

  useAddShortcutListener(() => focusNextListItem("up"), "ArrowUp", [
    taskList.length,
  ]);

  useAddShortcutListener(
    () => {
      if (focusedTaskIndex !== -1) {
        const focusedTask = taskList[focusedTaskIndex];
        setTaskDialogOptions({ open: true, task: focusedTask });
      }
    },
    "e",
    [listItemsRef.current.length]
  );

  useAddShortcutListener(
    () => {
      if (focusedTaskIndex !== -1) {
        const focusedTask = taskList[focusedTaskIndex];
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
                deleteTask(focusedTask);
              },
            },
          ],
        });
      }
    },
    "d",
    [listItemsRef.current.length]
  );

  const focusNextListItem = (direction: "up" | "down") => {
    let index = focusedTaskIndex;
    if (index === -1) {
      index = 0;
    } else if (direction === "down") {
      index = index + 1 < taskList.length ? index + 1 : 0;
    } else {
      index = index - 1 >= 0 ? index - 1 : taskList.length - 1;
    }
    listItemsRef.current[index].focus();
  };

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
                taskList={taskList}
                focusedTaskIndex={focusedTaskIndex}
                listItemsRef={listItemsRef}
                showHeader={!activeTaskList}
                onFocus={(index) => setFocusedTaskIndex(index)}
                onBlur={() => setFocusedTaskIndex(-1)}
              />
            ))}
        </Stack>
      )}
      {taskView === "timeline" && (
        <TaskTimeline
          taskList={taskList}
          focusedTaskIndex={focusedTaskIndex}
          listItemsRef={listItemsRef}
          onFocus={(index) => setFocusedTaskIndex(index)}
          onBlur={() => setFocusedTaskIndex(-1)}
        />
      )}
    </>
  );
};

export default TaskView;
