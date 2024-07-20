import { TaskListHeader } from "@/components/TaskListHeader";
import { TaskListItem } from "@/components/TaskListItem";
import { TaskListSubheader } from "@/components/TaskListSubheader";
import { List } from "@/components/ui/list";
import { Task } from "@/utils/task";
import { TaskGroup } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import { ListItem } from "@mui/joy";
import { isEqual } from "lodash";
import { memo, MutableRefObject } from "react";
import { useTranslation } from "react-i18next";

interface TaskListProps {
  fileName: string;
  filePath: string;
  taskGroups: TaskGroup[];
  tasks: Task[];
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  showHeader?: boolean;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onClick: (task: Task) => void;
}

function propsAreEqual(prev: TaskListProps, next: TaskListProps) {
  return (
    prev.fileName === next.fileName &&
    prev.filePath === next.filePath &&
    isEqual(prev.taskGroups, next.taskGroups) &&
    isEqual(prev.tasks, next.tasks) &&
    prev.showHeader === next.showHeader
  );
}

export const TaskList = memo((props: TaskListProps) => {
  const {
    fileName,
    filePath,
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
          {showHeader && (
            <TaskListHeader fileName={fileName} filePath={filePath} />
          )}
          {taskGroups.map((group) => (
            <ListItem nested key={group.label}>
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
                      onCheckboxClick={() => toggleCompleteTask(task)}
                      onFocus={() => onFocus(index)}
                      onBlur={onBlur}
                    />
                  );
                })}
              </List>
            </ListItem>
          ))}
        </List>
      )}
      {!hasItems && (
        <div className="px-5 pb-3 text-muted-foreground">{t("No tasks")}</div>
      )}
    </>
  );
}, propsAreEqual);
