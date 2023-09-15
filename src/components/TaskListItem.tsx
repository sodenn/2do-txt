import { TaskBody } from "@/components/TaskBody";
import { TaskListItemMenu } from "@/components/TaskListItemMenu";
import { Task } from "@/utils/task";
import {
  Checkbox,
  DropdownProps,
  ListItem,
  ListItemButton,
  Stack,
  styled,
} from "@mui/joy";
import { forwardRef, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== "menuOpen",
})<{ menuOpen: boolean }>(({ menuOpen }) => ({
  ".MuiMenuButton-root": {
    visibility: menuOpen ? "visible" : "hidden",
    backgroundColor: menuOpen
      ? "var(--joy-palette-neutral-plainActiveBg)"
      : undefined,
  },
  "@media (pointer: coarse)": {
    ".MuiMenuButton-root": {
      visibility: "visible",
    },
  },
  "&:hover .MuiMenuButton-root": {
    visibility: "visible",
  },
}));

const StyledListItemButton = styled(ListItemButton)({
  "&:focus-visible": {
    zIndex: "0",
  },
  "@media (pointer: coarse)": {
    '&:not(.Mui-selected, [aria-selected="true"]):active': {
      backgroundColor: "inherit",
    },
    ':not(.Mui-selected, [aria-selected="true"]):hover': {
      backgroundColor: "inherit",
    },
  },
});

const DateContainer = styled("div")({
  opacity: 0.5,
  fontSize: "0.75em",
});

interface TaskListItemProps {
  task: Task;
  onCheckboxClick: () => void;
  onButtonClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export const TaskListItem = forwardRef<HTMLDivElement, TaskListItemProps>(
  (props, ref) => {
    const { task, onButtonClick, onCheckboxClick, onBlur, onFocus } = props;
    const checkboxRef = useRef<HTMLButtonElement>(null);
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleButtonClick = (event: any) => {
      if (event.code === "Space") {
        onCheckboxClick();
      } else {
        onButtonClick();
      }
    };

    const handleOpenChange: DropdownProps["onOpenChange"] = (_, open) => {
      setMenuOpen(open);
    };

    return (
      <StyledListItem
        data-testid="task"
        onFocus={onFocus}
        onBlur={onBlur}
        menuOpen={menuOpen}
        startAction={
          <Checkbox
            ref={checkboxRef}
            onClick={onCheckboxClick}
            checked={task.completed}
            slotProps={{
              input: {
                tabIndex: -1,
                "aria-label": "Complete task",
                "aria-checked": task.completed,
              },
            }}
          />
        }
        endAction={
          <TaskListItemMenu task={task} onOpenChange={handleOpenChange} />
        }
      >
        <StyledListItemButton
          ref={ref}
          sx={{
            borderRadius: "sm",
          }}
          onClick={handleButtonClick}
          data-testid="task-button"
        >
          <Stack direction="column" sx={{ py: 1 }}>
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
        </StyledListItemButton>
      </StyledListItem>
    );
  },
);
