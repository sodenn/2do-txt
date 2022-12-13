import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Timeline } from "@mui/lab";
import { Box, Typography } from "@mui/material";
import { isEqual } from "lodash";
import { memo, MutableRefObject, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import { Task } from "../utils/task";
import { TimelineTask } from "../utils/task-list";
import ScrollTo from "./ScrollTo";
import TaskTimelineItem from "./TaskTimelineItem";
import TimelineAddButton from "./TimelineAddButton";

interface TaskTimelineProps {
  tasks: TimelineTask[];
  focusedTaskId?: string;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onListItemClick: (task: Task) => void;
}

function propsAreEqual(prev: TaskTimelineProps, next: TaskTimelineProps) {
  return isEqual(prev.tasks, next.tasks);
}

const TaskTimeline = memo((props: TaskTimelineProps) => {
  const {
    tasks,
    focusedTaskId,
    listItemsRef,
    onFocus,
    onBlur,
    onListItemClick,
  } = props;
  const { t } = useTranslation();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { deleteTask, completeTask } = useTask();
  const { searchTerm } = useFilter();
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const [addButtonElem, setAddButtonElem] = useState<HTMLElement | null>(null);

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

  useEffect(() => {
    addButtonElem?.scrollIntoView({
      block: "start",
    });
  }, [addButtonElem]);

  if (
    tasks.filter((t) => !t._timelineFlags.firstOfToday).length === 0 &&
    searchTerm
  ) {
    return (
      <Typography
        sx={{ mt: 1, mx: 2, mb: 3, fontStyle: "italic" }}
        color="text.disabled"
      >
        {t("No tasks found")}
      </Typography>
    );
  }

  return (
    <Timeline
      aria-label="Task list"
      ref={parent}
      sx={{ mt: 0, px: { xs: 0, sm: 1 }, py: 0 }}
    >
      {tasks.map((task, index) => (
        <Box
          data-testid={!task._timelineFlags.firstOfToday ? "task" : undefined}
          key={task._id}
        >
          {!task._timelineFlags.firstOfToday && (
            <TaskTimelineItem
              ref={(el) => {
                if (listItemsRef.current && el) {
                  const notFocusablePredecessor = tasks.some(
                    (t, idx) => t._timelineFlags.firstOfToday && idx < index
                  );
                  listItemsRef.current[
                    notFocusablePredecessor ? index - 1 : index
                  ] = el;
                }
              }}
              task={task}
              onClick={() => onListItemClick(task)}
              onCheckboxClick={() => completeTask(task)}
              onDelete={() => handleDelete(task)}
              focused={focusedTaskId === task._id}
              onFocus={() => onFocus(index)}
              onBlur={onBlur}
            />
          )}
          {task._timelineFlags.firstOfToday && (
            <TimelineAddButton
              ref={setAddButtonElem}
              flags={task._timelineFlags}
            />
          )}
          {addButtonElem && <ScrollTo target={addButtonElem} />}
        </Box>
      ))}
    </Timeline>
  );
}, propsAreEqual);

export default TaskTimeline;
