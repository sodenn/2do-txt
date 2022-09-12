import { Timeline } from "@mui/lab";
import { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useTask } from "../data/TaskContext";
import { useTaskDialog } from "../data/TaskDialogContext";
import { Task } from "../utils/task";
import TaskTimelineItem from "./TaskTimelineItem";

interface TaskTimelineProps {
  taskList: Task[];
  focusedTaskIndex: number;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  onFocus: (index: number) => void;
  onBlur: () => void;
}

const TaskTimeline = (props: TaskTimelineProps) => {
  const { taskList, focusedTaskIndex, listItemsRef, onFocus, onBlur } = props;
  const { t } = useTranslation();
  const { setTaskDialogOptions } = useTaskDialog();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { deleteTask, completeTask } = useTask();

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
    <Timeline sx={{ m: 0, pl: { xs: 0.5, sm: 1 }, py: 0 }}>
      {taskList.map((task, index) => (
        <TaskTimelineItem
          key={index}
          ref={(el) => {
            if (listItemsRef.current && el) {
              listItemsRef.current[index] = el;
            }
          }}
          hideTopConnector={index === 0}
          hideBottomConnector={index === taskList.length - 1}
          task={task}
          onClick={() => setTaskDialogOptions({ open: true, task })}
          onCheckboxClick={() => completeTask(task)}
          onDelete={() => handleDelete(task)}
          focused={focusedTaskIndex === index}
          onFocus={() => onFocus(index)}
          onBlur={onBlur}
        />
      ))}
    </Timeline>
  );
};

export default TaskTimeline;
