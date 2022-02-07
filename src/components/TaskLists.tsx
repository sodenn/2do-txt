import { Stack } from "@mui/material";
import React, { useRef, useState } from "react";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import { Task } from "../utils/task";
import { useTaskGroups } from "../utils/task-list";
import TaskList from "./TaskList";

const TaskLists = () => {
  const { activeTaskList, openTaskDialog, openDeleteConfirmationDialog } =
    useTask();
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1);
  const listItemsRef = useRef<HTMLDivElement[]>([]);
  const taskGroups = useTaskGroups();
  const flatTaskList = taskGroups.flatMap((i) =>
    i.groups.reduce<Task[]>((prev, curr) => [...prev, ...curr.items], [])
  );

  useAddShortcutListener(() => focusNextListItem("down"), "ArrowDown", [
    flatTaskList.length,
  ]);

  useAddShortcutListener(() => focusNextListItem("up"), "ArrowUp", [
    flatTaskList.length,
  ]);

  useAddShortcutListener(
    () => {
      if (focusedTaskIndex !== -1) {
        const focusedTask = flatTaskList[focusedTaskIndex];
        openTaskDialog(true, focusedTask);
      }
    },
    "e",
    [listItemsRef.current.length]
  );

  useAddShortcutListener(
    () => {
      if (focusedTaskIndex !== -1) {
        const focusedTask = flatTaskList[focusedTaskIndex];
        openDeleteConfirmationDialog(true, focusedTask);
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
      index = index + 1 < flatTaskList.length ? index + 1 : 0;
    } else {
      index = index - 1 >= 0 ? index - 1 : flatTaskList.length - 1;
    }
    listItemsRef.current[index].focus();
  };

  return (
    <>
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
              flatTaskList={flatTaskList}
              focusedTaskIndex={focusedTaskIndex}
              listItemsRef={listItemsRef}
              showHeader={!activeTaskList}
              onFocus={(index) => setFocusedTaskIndex(index)}
              onBlur={() => setFocusedTaskIndex(-1)}
            />
          ))}
      </Stack>
    </>
  );
};

export default TaskLists;
