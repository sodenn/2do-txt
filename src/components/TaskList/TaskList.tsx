import { Box, Chip, List, ListSubheader, styled } from "@mui/material";
import React, { createRef, useState } from "react";
import { useAppContext } from "../../data/AppContext";
import { useTask } from "../../data/TaskContext";
import { useAddShortcutListener } from "../../utils/shortcuts";
import { Task } from "../../utils/task";
import TaskListItem from "../TaskListItem";

const StyledListSubheader = styled(ListSubheader)`
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0),
    ${({ theme }) => theme.palette.background.default} 15%
  );
`;

const TaskList = () => {
  const ref = createRef<HTMLDivElement>();
  const {
    filteredTaskList,
    groupedTaskList,
    completeTask,
    openTaskDialog,
    deleteTask,
  } = useTask();
  const { sortBy } = useAppContext();
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1);

  useAddShortcutListener(
    (key) => {
      focusNextListItem(key === "ArrowDown" ? "down" : "up");
    },
    ["ArrowDown", "ArrowUp"],
    [filteredTaskList.length]
  );

  useAddShortcutListener(
    () => {
      if (focusedTaskIndex !== -1) {
        const focusedTask = filteredTaskList[focusedTaskIndex];
        openTaskDialog(true, focusedTask);
      }
    },
    "e",
    [ref]
  );

  useAddShortcutListener(
    () => {
      if (focusedTaskIndex !== -1) {
        const focusedTask = filteredTaskList[focusedTaskIndex];
        deleteTask(focusedTask);
      }
    },
    "d",
    [ref]
  );

  const focusNextListItem = (direction: "up" | "down") => {
    const root = ref.current;

    if (!root) {
      return;
    }

    let index = focusedTaskIndex;
    if (index === -1) {
      index = 0;
    } else if (direction === "down") {
      index = index + 1 < filteredTaskList.length ? index + 1 : 0;
    } else {
      index = index - 1 >= 0 ? index - 1 : filteredTaskList.length - 1;
    }

    const listItems = root.querySelectorAll<HTMLButtonElement>(
      '[role="button"][aria-label="task"]'
    );

    listItems.item(index).focus();
  };

  const contextMenuClicked = (element: Element): boolean => {
    if (
      typeof element.getAttribute === "function" &&
      (element.getAttribute("role") === "menu" ||
        element.getAttribute("role") === "menuitem")
    ) {
      return true;
    }
    return (
      !!element.parentNode && contextMenuClicked(element.parentNode as Element)
    );
  };

  const handleClick = (event: any, task: Task) => {
    if (!contextMenuClicked(event.target)) {
      completeTask(task);
    }
  };

  return (
    <Box ref={ref}>
      {filteredTaskList.length > 0 && (
        <List role="list" aria-label="Task list" subheader={<li />}>
          {groupedTaskList.map((group, groupIndex) => (
            <li key={group.groupKey}>
              <ul style={{ padding: 0 }}>
                {group.groupKey && (
                  <StyledListSubheader>
                    <Chip
                      sx={{ px: 1 }}
                      size="small"
                      label={group.groupKey}
                      variant="outlined"
                      color={sortBy === "dueDate" ? "warning" : "secondary"}
                    />
                  </StyledListSubheader>
                )}
                {group.items.map((task, itemIndex) => {
                  const index = groupIndex + itemIndex;
                  return (
                    <TaskListItem
                      key={index}
                      task={task}
                      index={index}
                      focused={focusedTaskIndex === index}
                      onClick={(event) => handleClick(event, task)}
                      onFocus={() => setFocusedTaskIndex(index)}
                      onBlur={() => setFocusedTaskIndex(-1)}
                    />
                  );
                })}
              </ul>
            </li>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TaskList;
