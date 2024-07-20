import { TaskBody } from "@/components/TaskBody";
import { Checkbox } from "@/components/ui/checkbox";
import { ListItem } from "@/components/ui/list";
import { Task } from "@/utils/task";
import { ListItemButton, Stack, styled } from "@mui/joy";
import { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";

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
      <ListItem data-testid="task" onFocus={onFocus} onBlur={onBlur}>
        <Checkbox
          ref={checkboxRef}
          onClick={onCheckboxClick}
          checked={task.completed}
          tabIndex={-1}
          aria-label="Complete task"
          aria-checked={task.completed}
        />
        <StyledListItemButton
          ref={ref}
          onClick={handleButtonClick}
          data-testid="task-button"
        >
          <Stack direction="column" sx={{ py: 1 }}>
            <TaskBody task={task} />
            {task.completionDate && (
              <div className="text-xs text-muted-foreground">
                {t("Completed", { completionDate: task.completionDate })}
              </div>
            )}
            {task.creationDate && !task.completed && (
              <div className="text-xs text-muted-foreground">
                {t("Created", { creationDate: task.creationDate })}
              </div>
            )}
          </Stack>
        </StyledListItemButton>
      </ListItem>
    );
  },
);
