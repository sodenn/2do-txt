import {
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  Stack,
  styled,
} from "@mui/material";
import React, { createRef, useState } from "react";
import { useTask } from "../../data/TaskContext";
import { useAddShortcutListener } from "../../utils/shortcuts";
import { Task } from "../../utils/task";
import TaskBody from "../TaskBody";
import TaskContextMenu from "../TaskContextMenu";
import TaskDates from "../TaskDates";

const TaskItemButton = styled(ListItemButton)`
  border-radius: ${({ theme }: any) => theme.shape.borderRadius};
  .MuiIconButton-root {
    visibility: hidden;
  }
  @media (pointer: coarse) {
    .MuiIconButton-root {
      visibility: visible;
    }
  }
  &:hover {
    .MuiIconButton-root {
      visibility: visible;
    }
  }
`;

const TaskList = () => {
  const ref = createRef<HTMLDivElement>();
  const { filteredTaskList, completeTask, openTaskDialog } = useTask();
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
        <List sx={{ mt: 1 }} role="list">
          {filteredTaskList.map((task, index) => (
            <ListItem role="listitem" key={index} disablePadding>
              <TaskItemButton
                aria-label="task"
                aria-current={focusedTaskIndex === index}
                onClick={(event) => handleClick(event, task)}
                onFocus={() => setFocusedTaskIndex(index)}
                onBlur={() => setFocusedTaskIndex(-1)}
                dense
              >
                <Stack
                  px={{ xs: 0.5, sm: 0 }}
                  direction="row"
                  spacing={1}
                  sx={{ width: "100%" }}
                >
                  <div>
                    <Checkbox
                      role="checkbox"
                      aria-label="completed"
                      aria-checked={task.completed}
                      edge="start"
                      checked={task.completed}
                      tabIndex={-1}
                    />
                  </div>
                  <Stack py={1} direction="column" sx={{ flex: "auto" }}>
                    <TaskBody task={task} />
                    <TaskDates task={task} />
                  </Stack>
                  <div>
                    <TaskContextMenu task={task} />
                  </div>
                </Stack>
              </TaskItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TaskList;
