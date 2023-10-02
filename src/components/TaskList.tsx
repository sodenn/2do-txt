import { TaskListHeader } from "@/components/TaskListHeader";
import { TaskListItem } from "@/components/TaskListItem";
import { TaskListSubheader } from "@/components/TaskListSubheader";
import { Task } from "@/utils/task";
import { TaskGroup } from "@/utils/task-list";
import { useTask } from "@/utils/useTask";
import { List, ListItem, Typography, styled } from "@mui/joy";
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

const StyledList = styled(List)(({ theme }) => ({
  [theme.breakpoints.down("lg")]: {
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
  },
}));

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
      {(hasItems || showHeader) && (
        <StyledList data-testid="task-list">
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
        </StyledList>
      )}
      {!hasItems && (
        <Typography sx={{ px: 2, pb: 3 }} level="body-md" color="neutral">
          {t("No tasks")}
        </Typography>
      )}
    </>
  );
}, propsAreEqual);
