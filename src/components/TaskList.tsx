import { TaskBody } from "@/components/TaskBody";
import { Checkbox, CheckboxProps } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { List, ListItem } from "@/components/ui/list";
import { useFilterStore } from "@/stores/filter-store";
import { Task } from "@/utils/task";
import { TaskGroup } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import { isEqual } from "lodash";
import { ExternalLinkIcon } from "lucide-react";
import {
  KeyboardEvent,
  MutableRefObject,
  forwardRef,
  memo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

interface TaskListProps {
  id: string;
  filename: string;
  taskGroups: TaskGroup[];
  tasks: Task[];
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
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
  id: string;
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
        <List data-testid="task-list">
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
        <div className="px-5 pb-3 text-muted-foreground">{t("No tasks")}</div>
      )}
    </>
  );
}, propsAreEqual);

const TaskListItem = forwardRef<HTMLDivElement, TaskListItemProps>(
  (props, ref) => {
    const { task, onButtonClick, onCheckedChange, onBlur, onFocus } = props;
    const checkboxRef = useRef<HTMLButtonElement>(null);
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

    return (
      <ListItem
        buttonRef={ref}
        data-testid="task"
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onButtonClick}
        onKeyDown={handleKeyDown}
        className="my-0.5 items-start py-3 sm:py-4"
      >
        <Checkbox
          ref={checkboxRef}
          onClick={handleCheckedClick}
          onCheckedChange={onCheckedChange}
          checked={task.completed}
          tabIndex={-1}
          aria-label="Complete task"
          aria-checked={task.completed}
          className="my-1 bg-background"
        />
        <div className="flex flex-col">
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

function TaskListSubheader({ title }: TaskListSubheaderProps) {
  const sortBy = useFilterStore((state) => state.sortBy);
  return (
    <div className="sticky top-2 z-10 my-2 px-2">
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
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  return (
    <li
      className="mb-2 flex cursor-pointer items-center overflow-hidden rounded p-3 hover:bg-muted/50"
      tabIndex={-1}
      onClick={() => setActiveTaskListId(id)}
    >
      <h3 className="flex-1 truncate font-semibold leading-none tracking-tight">
        {filename}
      </h3>
      <ExternalLinkIcon className="h-4 w-4" />
    </li>
  );
}
