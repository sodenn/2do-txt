import {
  alpha,
  Box,
  Chip,
  List,
  ListSubheader,
  styled,
  Typography,
} from "@mui/material";
import { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import { Task } from "../utils/task";
import { TaskGroup } from "../utils/task-list";
import TaskListItem from "./TaskListItem";

const StyledListSubheader = styled(ListSubheader)`
  // avoid scrollbar overlapping (Safari mobile)
  top: -1px;
  margin-right: ${({ theme }) => theme.spacing(1)};
  background: linear-gradient(
    to top,
    ${({ theme }) => alpha(theme.palette.background.default, 0)},
    ${({ theme }) => theme.palette.background.default} 15%
  );
`;

interface TaskListProps {
  fileName: string;
  taskGroups: TaskGroup[];
  flatTaskList: Task[];
  focusedTaskIndex: number;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  showHeader?: boolean;
  onFocus: (index: number) => void;
  onBlur: () => void;
}

const TaskList = (props: TaskListProps) => {
  const {
    fileName,
    taskGroups,
    flatTaskList,
    focusedTaskIndex,
    listItemsRef,
    showHeader = false,
    onFocus,
    onBlur,
  } = props;
  const { t } = useTranslation();
  const { completeTask, openTaskDialog } = useTask();
  const { sortBy } = useFilter();
  const hasItems = taskGroups.some((g) => g.items.length > 0);

  return (
    <Box>
      {showHeader && (
        <Typography
          noWrap
          sx={{ mx: 2, direction: "rtl", textAlign: "left" }}
          variant="h5"
        >
          {fileName}
        </Typography>
      )}
      {!hasItems && (
        <Typography sx={{ mt: 1, mx: 2, mb: 3 }} color="text.disabled">
          {t("No tasks")}
        </Typography>
      )}
      {hasItems && (
        <List aria-label="Task list" subheader={<li />}>
          {taskGroups.map((group) => (
            <li key={group.label}>
              <ul style={{ padding: 0 }}>
                {group.label && (
                  <StyledListSubheader>
                    <Chip
                      sx={{ px: 1 }}
                      size="small"
                      label={group.label}
                      variant="outlined"
                      color={sortBy === "dueDate" ? "warning" : "secondary"}
                    />
                  </StyledListSubheader>
                )}
                {group.items.map((task) => {
                  const index = flatTaskList.indexOf(task);
                  return (
                    <TaskListItem
                      ref={(el) => {
                        if (listItemsRef.current && el) {
                          listItemsRef.current[index] = el;
                        }
                      }}
                      key={index}
                      task={task}
                      focused={focusedTaskIndex === index}
                      onClick={() => openTaskDialog(true, task)}
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
};

export default TaskList;
