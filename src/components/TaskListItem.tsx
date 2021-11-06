import {
  Checkbox,
  ListItem,
  ListItemButton,
  Stack,
  styled,
} from "@mui/material";
import React from "react";
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
  index: number;
  focused: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const TaskListItem = (props: TaskListItemProps) => {
  const { index, task, focused, onClick, onBlur, onFocus } = props;
  return (
    <ListItem role="listitem" key={index} disablePadding>
      <TaskItemButton
        key={index}
        aria-label="task"
        aria-current={focused}
        onClick={onClick}
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
              role="checkbox"
              aria-label="completed"
              aria-checked={task.completed}
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
            <TaskListItemMenu task={task} />
          </div>
        </Stack>
      </TaskItemButton>
    </ListItem>
  );
};

export default TaskListItem;
