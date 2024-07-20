import { TaskBody } from "@/components/TaskBody";
import { Checkbox, CheckboxProps } from "@/components/ui/checkbox";
import { ListItem } from "@/components/ui/list";
import { Task } from "@/utils/task";
import { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";

interface TaskListItemProps {
  task: Task;
  onCheckedChange: () => void;
  onButtonClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export const TaskListItem = forwardRef<HTMLDivElement, TaskListItemProps>(
  (props, ref) => {
    const { task, onButtonClick, onCheckedChange, onBlur, onFocus } = props;
    const checkboxRef = useRef<HTMLButtonElement>(null);
    const { t } = useTranslation();

    const handleCheckedClick: CheckboxProps["onClick"] = (event) => {
      event.stopPropagation();
    };

    const handleButtonClick = (event: any) => {
      if (event.code === "Space") {
        onCheckedChange();
      } else {
        onButtonClick();
      }
    };

    return (
      <ListItem
        buttonRef={ref}
        data-testid="task"
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={handleButtonClick}
      >
        <Checkbox
          ref={checkboxRef}
          onClick={handleCheckedClick}
          onCheckedChange={onCheckedChange}
          checked={task.completed}
          tabIndex={-1}
          aria-label="Complete task"
          aria-checked={task.completed}
        />
        <div className="flex flex-col py-1" data-testid="task-button">
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
        </div>
      </ListItem>
    );
  },
);
