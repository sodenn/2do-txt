import { alpha, Box, Chip, List, ListSubheader, styled } from "@mui/material";
import { useRef, useState } from "react";
import { useFilter } from "../../data/FilterContext";
import { useTask } from "../../data/TaskContext";
import { useAddShortcutListener } from "../../utils/shortcuts";
import { Task } from "../../utils/task";
import TaskListItem from "../TaskListItem";

const StyledListSubheader = styled(ListSubheader)`
  // avoid scrollbar overlapping (Safari mobile)
  top: -1px;
  margin-right: ${({ theme }) => theme.spacing(1)};
  background: linear-gradient(
    to top,
    ${({ theme }) => alpha(theme.palette.background.default, 0)},
    ${({ theme }) => theme.palette.background.default} 15%
  );
`;

const TaskList = () => {
  const listItemsRef = useRef<HTMLDivElement[]>([]);
  const { taskGroups, completeTask, openTaskDialog, deleteTask } = useTask();
  const { sortBy } = useFilter();
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1);
  const flatTaskList = taskGroups.reduce<Task[]>(
    (prev, curr) => [...prev, ...curr.items],
    []
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
        deleteTask(focusedTask);
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
    <Box>
      {flatTaskList.length > 0 && (
        <List aria-label="Task list" subheader={<li />}>
          {taskGroups.map((group) => (
            <li key={group.label}>
              <ul style={{ padding: 0 }}>
                {group.label && (
                  <StyledListSubheader>
                    <Chip
                      sx={{ px: 1 }}
                      size="small"
                      label={group.label}
                      variant="outlined"
                      color={sortBy === "dueDate" ? "warning" : "secondary"}
                    />
                  </StyledListSubheader>
                )}
                {group.items.map((task) => {
                  const index = flatTaskList.indexOf(task);
                  return (
                    <TaskListItem
                      ref={(el) => {
                        if (listItemsRef.current && el) {
                          listItemsRef.current[index] = el;
                        }
                      }}
                      key={index}
                      task={task}
                      focused={focusedTaskIndex === index}
                      onClick={() => openTaskDialog(true, task)}
                      onCheckboxClick={() => completeTask(task)}
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
