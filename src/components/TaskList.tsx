import TaskListHeader from "@/components/TaskListHeader";
import TaskListItem from "@/components/TaskListItem";
import TaskListSubheader from "@/components/TaskListSubheader";
import { Task } from "@/utils/task";
import { TaskGroup } from "@/utils/task-list";
import useTask from "@/utils/useTask";
import { Box, List, Typography } from "@mui/material";
import { isEqual } from "lodash";
import { MutableRefObject, memo } from "react";
import { useTranslation } from "react-i18next";

interface TaskListProps {
  fileName: string;
  filePath: string;
  taskGroups: TaskGroup[];
  tasks: Task[];
  focusedTaskId?: string;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  showHeader?: boolean;
  onListItemClick: (task: Task) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
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

const TaskList = memo((props: TaskListProps) => {
  const {
    fileName,
    filePath,
    taskGroups,
    tasks,
    focusedTaskId,
    listItemsRef,
    showHeader = false,
    onFocus,
    onBlur,
    onListItemClick,
  } = props;
  const { t } = useTranslation();
  const { completeTask } = useTask();
  const hasItems = taskGroups.some((g) => g.items.length > 0);

  return (
    <Box>
      {showHeader && <TaskListHeader fileName={fileName} filePath={filePath} />}
      {!hasItems && (
        <Typography
          sx={{ mt: 1, mx: 2, mb: 3, fontStyle: "italic" }}
          color="text.disabled"
        >
          {t("No tasks")}
        </Typography>
      )}
      {hasItems && (
        <List aria-label="Task list" subheader={<li />}>
          {taskGroups.map((group) => (
            <li key={group.label}>
              <ul style={{ padding: 0 }}>
                {group.label && <TaskListSubheader title={group.label} />}
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
                      focused={focusedTaskId === task._id}
                      onClick={() => onListItemClick(task)}
                      onCheckboxClick={() => completeTask(task)}
                      onFocus={() => onFocus(index)}
                      onBlur={onBlur}
                    />
                  );
                })}
              </ul>
            </li>
          ))}
        </List>
      )}
    </Box>
  );
}, propsAreEqual);

export default TaskList;
