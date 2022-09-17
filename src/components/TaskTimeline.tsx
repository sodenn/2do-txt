import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Timeline } from "@mui/lab";
import { Box } from "@mui/material";
import { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { Task } from "../utils/task";
import { TimelineTask } from "../utils/task-list";
import TaskTimelineItem from "./TaskTimelineItem";

interface TaskTimelineProps {
  tasks: TimelineTask[];
  focusedTaskIndex: number;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  onFocus: (index: number) => void;
  onBlur: () => void;
}

const TaskTimeline = (props: TaskTimelineProps) => {
  const { tasks, focusedTaskIndex, listItemsRef, onFocus, onBlur } = props;
  const { t } = useTranslation();
  const { setTaskDialogOptions } = useTaskDialog();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { deleteTask, completeTask } = useTask();
  const [parent] = useAutoAnimate<HTMLUListElement>();

  const handleDelete = (task: Task) => {
    setConfirmationDialog({
      open: true,
      title: t("Delete task"),
      content: t("Are you sure you want to delete this task?"),
      buttons: [
        {
          text: t("Cancel"),
        },
        {
          text: t("Delete"),
          handler: () => {
            deleteTask(task);
          },
        },
      ],
    });
  };

  return (
    <Timeline ref={parent} sx={{ m: 0, pl: { xs: 0.5, sm: 1 }, py: 0 }}>
      {tasks.map((task, index) => (
        <Box key={task._id}>
          <TaskTimelineItem
            ref={(el) => {
              if (listItemsRef.current && el) {
                listItemsRef.current[index] = el;
              }
            }}
            task={task}
            onClick={() => setTaskDialogOptions({ open: true, task })}
            onCheckboxClick={() => completeTask(task)}
            onDelete={() => handleDelete(task)}
            focused={focusedTaskIndex === index}
            onFocus={() => onFocus(index)}
            onBlur={onBlur}
          />
        </Box>
      ))}
    </Timeline>
  );
};

export default TaskTimeline;
