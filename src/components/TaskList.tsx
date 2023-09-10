import { TaskListHeader } from "@/components/TaskListHeader";
import { TaskListItem } from "@/components/TaskListItem";
import { TaskListSubheader } from "@/components/TaskListSubheader";
import { Task } from "@/utils/task";
import { TaskGroup } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import { List, ListItem, Typography } from "@mui/joy";
import { isEqual } from "lodash";
import { MutableRefObject, memo } from "react";
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
  const { completeTask } = useTask();
  const hasItems = taskGroups.some((g) => g.items.length > 0);

  return (
    <>
      {showHeader && <TaskListHeader fileName={fileName} filePath={filePath} />}
      {!hasItems && (
        <Typography
          sx={{ pt: 1, px: 2, pb: 3 }}
          level="body-md"
          color="neutral"
        >
          {t("No tasks")}
        </Typography>
      )}
      {hasItems && (
        <List aria-label="Task list" sx={{ pl: { xs: 1, sm: 0 } }}>
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
                      key={task._id}
                      task={task}
                      onButtonClick={() => onClick(task)}
                      onCheckboxClick={() => completeTask(task)}
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
    </>
  );
}, propsAreEqual);
