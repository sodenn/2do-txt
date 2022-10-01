import { Checkbox, ListItemButton, Stack, styled } from "@mui/material";
import { forwardRef, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Task } from "../utils/task";
import TaskBody from "./TaskBody";
import TaskListItemMenu from "./TaskListItemMenu";

const TaskItemButton = styled(ListItemButton)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    borderRadius: theme.shape.borderRadius,
  },
  ".MuiIconButton-root": {
    visibility: "hidden",
  },
  "@media (pointer: coarse)": {
    ".MuiIconButton-root": {
      visibility: "visible",
    },
  },
  "&:hover": {
    ".MuiIconButton-root": {
      visibility: "visible",
    },
  },
}));

const DateContainer = styled("div")({
  opacity: 0.5,
  fontSize: "0.75em",
});

interface TaskListItemProps {
  task: Task;
  focused: boolean;
  onCheckboxClick: () => void;
  onClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const TaskListItem = forwardRef<HTMLDivElement, TaskListItemProps>(
  (props, ref) => {
    const { task, focused, onClick, onCheckboxClick, onBlur, onFocus } = props;
    const checkboxRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const { t } = useTranslation();

    const handleItemClick = (event: any) => {
      const checkboxClick =
        !!checkboxRef.current && checkboxRef.current.contains(event.target);

      const contextMenuClick =
        !!menuRef.current && menuRef.current.contains(event.target);

      const contextMenuButtonClick =
        !!menuButtonRef.current && menuButtonRef.current.contains(event.target);

      if (event.code === "Space") {
        onCheckboxClick();
      } else if (
        (!checkboxClick && !contextMenuClick && !contextMenuButtonClick) ||
        event.code === "Enter"
      ) {
        onClick();
      }
    };

    return useMemo(
      () => (
        <TaskItemButton
          ref={ref}
          aria-label="Task"
          data-testid="task-button"
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
              {task.completionDate && (
                <DateContainer>
                  {t("Completed", { completionDate: task.completionDate })}
                </DateContainer>
              )}
              {task.creationDate && !task.completed && (
                <DateContainer>
                  {t("Created", { creationDate: task.creationDate })}
                </DateContainer>
              )}
            </Stack>
            <div>
              <TaskListItemMenu
                task={task}
                menuRef={menuRef}
                menuButtonRef={menuButtonRef}
              />
            </div>
          </Stack>
        </TaskItemButton>
      ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [task, focused]
    );
  }
);

export default TaskListItem;
