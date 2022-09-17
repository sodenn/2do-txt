import { Box, List, Typography } from "@mui/material";
import { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { Task } from "../utils/task";
import { TaskGroup } from "../utils/task-list";
import TaskListHeader from "./TaskListHeader";
import TaskListItem from "./TaskListItem";
import TaskListSubheader from "./TaskListSubheader";

interface TaskListProps {
  fileName: string;
  filePath: string;
  taskGroups: TaskGroup[];
  tasks: Task[];
  focusedTaskIndex: number;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  showHeader?: boolean;
  onFocus: (index: number) => void;
  onBlur: () => void;
}

const TaskList = (props: TaskListProps) => {
  const {
    fileName,
    filePath,
    taskGroups,
    tasks,
    focusedTaskIndex,
    listItemsRef,
    showHeader = false,
    onFocus,
    onBlur,
  } = props;
  const { t } = useTranslation();
  const { completeTask } = useTask();
  const { setTaskDialogOptions } = useTaskDialog();
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
                      key={index}
                      task={task}
                      focused={focusedTaskIndex === index}
                      onClick={() => setTaskDialogOptions({ open: true, task })}
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
