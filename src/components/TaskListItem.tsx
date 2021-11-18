import {
  Checkbox,
  ListItem,
  ListItemButton,
  Stack,
  styled,
} from "@mui/material";
import { forwardRef, useRef } from "react";
import { Task } from "../utils/task";
import TaskBody from "./TaskBody";
import TaskDates from "./TaskDates";
import TaskListItemMenu from "./TaskListItemMenu";

const TaskItemButton = styled(ListItemButton)`
  border-radius: ${({ theme }: any) => theme.shape.borderRadius}px;
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

interface TaskListItemProps {
  task: Task;
  focused: boolean;
  onCheckboxClick: () => void;
  onItemClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const TaskListItem = forwardRef<HTMLDivElement, TaskListItemProps>(
  (props, ref) => {
    const { task, focused, onItemClick, onCheckboxClick, onBlur, onFocus } =
      props;

    const checkboxRef = useRef<HTMLButtonElement>(null);
    const contextMenuRef = useRef<HTMLButtonElement>(null);

    const handleItemClick = (event: any) => {
      const checkboxClick =
        !!checkboxRef.current && checkboxRef.current.contains(event.target);

      const contextMenuClick =
        !!contextMenuRef.current &&
        contextMenuRef.current.contains(event.target);

      if (event.code === "Space") {
        onCheckboxClick();
      } else if (
        (!checkboxClick && !contextMenuClick) ||
        event.code === "Enter"
      ) {
        onItemClick();
      }
    };

    return (
      <ListItem disablePadding>
        <TaskItemButton
          ref={ref}
          aria-label="Task"
          aria-current={focused}
          onClick={handleItemClick}
          onFocus={onFocus}
          onBlur={onBlur}
          dense
        >
          <Stack
            px={{ xs: 0.5, sm: 0 }}
            direction="row"
            spacing={0.5}
            sx={{ width: "100%" }}
          >
            <div>
              <Checkbox
                ref={checkboxRef}
                inputProps={{
                  "aria-label": "Complete task",
                  "aria-checked": task.completed,
                }}
                onClick={onCheckboxClick}
                edge="start"
                checked={task.completed}
                tabIndex={-1}
              />
            </div>
            <Stack
              direction="column"
              style={{
                paddingTop: 10,
                paddingBottom: 10,
                flex: "auto",
              }}
            >
              <TaskBody task={task} />
              <TaskDates task={task} />
            </Stack>
            <div>
              <TaskListItemMenu task={task} ref={contextMenuRef} />
            </div>
          </Stack>
        </TaskItemButton>
      </ListItem>
    );
  }
);

export default TaskListItem;
