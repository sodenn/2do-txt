import { TaskBody } from "@/components/TaskBody";
import { Button } from "@/components/ui/button";
import { Checkbox, CheckboxProps } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { List, ListItem } from "@/components/ui/list";
import { useFilterStore } from "@/stores/filter-store";
import { HAS_TOUCHSCREEN } from "@/utils/platform";
import { Task } from "@/utils/task";
import { TaskGroup } from "@/utils/task-list";
import { cn } from "@/utils/tw-utils";
import { useTask } from "@/utils/useTask";
import { isEqual } from "lodash";
import { ExternalLinkIcon, TrashIcon } from "lucide-react";
import {
  forwardRef,
  KeyboardEvent,
  memo,
  MouseEvent,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

interface TaskListProps {
  id: number;
  filename: string;
  taskGroups: TaskGroup[];
  tasks: Task[];
  listItemsRef: RefObject<HTMLDivElement[]>;
  showHeader?: boolean;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onClick: (task: Task) => void;
}

interface TaskListItemProps {
  task: Task;
  onCheckedChange: () => void;
  onButtonClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

interface TaskListSubheaderProps {
  title: string;
}

interface TaskListHeaderProps {
  id: number;
  filename: string;
}

function propsAreEqual(prev: TaskListProps, next: TaskListProps) {
  return (
    prev.filename === next.filename &&
    prev.id === next.id &&
    isEqual(prev.taskGroups, next.taskGroups) &&
    isEqual(prev.tasks, next.tasks) &&
    prev.showHeader === next.showHeader
  );
}

export const TaskList = memo((props: TaskListProps) => {
  const {
    id,
    filename,
    taskGroups,
    tasks,
    listItemsRef,
    showHeader = false,
    onFocus,
    onBlur,
    onClick,
  } = props;
  const { t } = useTranslation();
  const { toggleCompleteTask } = useTask();
  const hasItems = taskGroups.some((g) => g.items.length > 0);

  return (
    <>
      {(hasItems || showHeader) && (
        <List data-testid="task-list" className="mb-2">
          {showHeader && <TaskListHeader filename={filename} id={id} />}
          {taskGroups.map((group) => (
            <li className="list-none" key={group.label}>
              {group.label && <TaskListSubheader title={group.label} />}
              <List>
                {group.items.map((task) => {
                  const index = tasks.indexOf(task);
                  return (
                    <TaskListItem
                      ref={(el) => {
                        if (listItemsRef.current && el) {
                          listItemsRef.current[index] = el;
                        }
                      }}
                      key={task.id}
                      task={task}
                      onButtonClick={() => onClick(task)}
                      onCheckedChange={() => toggleCompleteTask(task)}
                      onFocus={() => {
                        onFocus(index);
                      }}
                      onBlur={onBlur}
                    />
                  );
                })}
              </List>
            </li>
          ))}
        </List>
      )}
      {!hasItems && (
        <div className="text-muted-foreground px-10 pb-3">{t("No tasks")}</div>
      )}
    </>
  );
}, propsAreEqual);

const TaskListItem = forwardRef<HTMLDivElement, TaskListItemProps>(
  (props, ref) => {
    const { task, onButtonClick, onCheckedChange, onBlur, onFocus } = props;
    const checkboxRef = useRef<HTMLButtonElement>(null);
    const { deleteTaskWithConfirmation } = useTask();
    const { t } = useTranslation();

    const handleCheckedClick: CheckboxProps["onClick"] = (event) => {
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.code === "Space") {
        event.preventDefault();
        onCheckedChange();
      }
      if (event.code === "Enter") {
        onButtonClick();
      }
    };

    const handleDelete = useCallback(
      (event: MouseEvent) => {
        event.stopPropagation();
        if (task) {
          deleteTaskWithConfirmation(task);
        }
      },
      [deleteTaskWithConfirmation, task],
    );

    return (
      <ListItem
        buttonRef={ref}
        data-testid="task"
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onButtonClick}
        onKeyDown={handleKeyDown}
        className="group relative my-0.5 items-start py-2 sm:py-4"
      >
        <Checkbox
          ref={checkboxRef}
          onClick={handleCheckedClick}
          onCheckedChange={onCheckedChange}
          checked={task.completed}
          tabIndex={-1}
          aria-label="Complete task"
          aria-checked={task.completed}
          className="bg-background my-1"
        />
        <div
          className={cn("flex flex-1 flex-col", !HAS_TOUCHSCREEN && "pr-14")}
        >
          <TaskBody task={task} />
          {task.completionDate && (
            <div className="text-muted-foreground text-xs">
              {t("Completed", { completionDate: task.completionDate })}
            </div>
          )}
          {task.creationDate && !task.completed && (
            <div className="text-muted-foreground text-xs">
              {t("Created", { creationDate: task.creationDate })}
            </div>
          )}
        </div>
        {!HAS_TOUCHSCREEN && (
          <Button
            onClick={handleDelete}
            role="button"
            size="icon"
            variant="ghost"
            aria-label="Delete task"
            className="absolute top-0 right-4 bottom-0 m-auto opacity-0 transition-opacity duration-100 ease-in-out group-hover:opacity-50 group-focus-visible:opacity-50 focus-visible:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </ListItem>
    );
  },
);

function TaskListSubheader({ title }: TaskListSubheaderProps) {
  const sortBy = useFilterStore((state) => state.sortBy);
  return (
    <div className="sticky top-2 z-10 my-2 pl-8">
      <Chip
        variant="outline"
        size="sm"
        aria-label="Task group"
        color={
          sortBy === "dueDate"
            ? "warning"
            : sortBy === "context"
              ? "success"
              : sortBy === "project"
                ? "info"
                : sortBy === "priority"
                  ? "danger"
                  : "secondary"
        }
      >
        {title}
      </Chip>
    </div>
  );
}

function TaskListHeader(props: TaskListHeaderProps) {
  const { id, filename } = props;
  const setSelectedTaskListIds = useFilterStore(
    (state) => state.setSelectedTaskListIds,
  );
  return (
    <li
      role="button"
      className="hover:bg-muted mb-1 flex cursor-pointer items-center overflow-hidden rounded px-10 py-3"
      tabIndex={-1}
      onClick={() => setSelectedTaskListIds([id])}
    >
      <h3 className="flex-1 truncate leading-none font-semibold tracking-tight">
        {filename}
      </h3>
      <ExternalLinkIcon className="h-4 w-4" />
    </li>
  );
}
