import { TaskBody } from "@/components/TaskBody";
import { Task } from "@/utils/task";
import { Checkbox, ListItem, ListItemButton, Stack, styled } from "@mui/joy";
import { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== "menuOpen",
})(({ theme }) => ({
  ".MuiListItem-startAction": {
    left: theme.spacing(0.5), // align checkbox with list
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.radius.sm,
  "@media (pointer: coarse)": {
    '&:not(.Mui-selected, [aria-selected="true"]):active': {
      backgroundColor: "inherit",
    },
    ':not(.Mui-selected, [aria-selected="true"]):hover': {
      backgroundColor: "inherit",
    },
  },
}));

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

    const handleButtonClick = (event: any) => {
      if (event.code === "Space") {
        onCheckboxClick();
      } else {
        onButtonClick();
      }
    };

    return (
      <StyledListItem
        data-testid="task"
        onFocus={onFocus}
        onBlur={onBlur}
        startAction={
          <Checkbox
            ref={checkboxRef}
            onClick={onCheckboxClick}
            checked={task.completed}
            sx={(theme) => ({
              [theme.breakpoints.only("xs")]: {
                "--Checkbox-size": "1.4rem", // increase size for mobile for easier tapping
              },
            })}
            slotProps={{
              input: {
                tabIndex: -1,
                "aria-label": "Complete task",
                "aria-checked": task.completed,
              },
            }}
          />
        }
      >
        <StyledListItemButton
          ref={ref}
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
