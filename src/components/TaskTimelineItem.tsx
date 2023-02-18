import AccessAlarmOutlinedIcon from "@mui/icons-material/AccessAlarmOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import {
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  IconButtonProps,
  ListItem,
  ListItemButton,
  styled,
} from "@mui/material";
import { format } from "date-fns";
import { forwardRef, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import useSettings from "../data/settings-store";
import { formatLocaleDate } from "../utils/date";
import { TimelineTask } from "../utils/task-list";
import TaskBody from "./TaskBody";

const locales = {
  de: "d. LLL.",
  en: "d LLL",
};

interface TimelineItemProps {
  task: TimelineTask;
  focused: boolean;
  onClick: () => void;
  onCheckboxClick: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const DateBox = styled(Box)(({ theme }) => ({
  gap: theme.spacing(0.5),
  display: "flex",
  alignItems: "center",
  ...theme.typography.body2,
}));

function TaskOppositeContent({ task }: Pick<TimelineItemProps, "task">) {
  const language = useSettings((state) => state.language);
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        width: 120,
        display: "inline-flex",
        justifyContent: "right",
        alignItems: "center",
        gap: 1,
        visibility:
          task._timelineFlags.firstOfDay || task._timelineFlags.firstWithoutDate
            ? "visible"
            : "hidden",
        color: "text.secondary",
      }}
    >
      {!!task.dueDate && !task.completionDate && (
        <AccessAlarmOutlinedIcon fontSize="small" />
      )}
      {task._timelineDate && format(task._timelineDate, locales[language])}
      {task._timelineFlags.firstWithoutDate && t("Without date")}
    </Box>
  );
}

function YearChip({ task }: Pick<TimelineItemProps, "task">) {
  return (
    <Box
      sx={{
        alignItems: "center",
        flexDirection: "column",
        display: {
          xs: "none",
          sm: "inline-flex",
        },
        visibility: task._timelineFlags.firstOfYear ? "visible" : "hidden",
        height: !task._timelineFlags.firstOfYear ? "1px" : undefined,
      }}
    >
      <Chip
        size="small"
        sx={{ my: 1 }}
        label={task._timelineDate && format(task._timelineDate, "yyyy")}
      />
      <TimelineConnector
        sx={{
          flexGrow: 0,
          pt: 2,
          bgcolor:
            task._timelineFlags.today && !task._timelineFlags.firstOfToday
              ? "info.main"
              : "action.disabled",
        }}
      />
    </Box>
  );
}

function TaskCheckbox(props: Pick<TimelineItemProps, "task" | "onClick">) {
  const { task, onClick } = props;
  return (
    <Checkbox
      sx={{ mx: 1 }}
      size="small"
      tabIndex={-1}
      onClick={onClick}
      checked={task.completed}
      color={task._timelineFlags.today ? "primary" : "default"}
      inputProps={{
        "aria-label": "Complete task",
        "aria-checked": task.completed,
      }}
      icon={
        <RadioButtonUncheckedOutlinedIcon
          sx={{
            color: task._timelineFlags.today ? "info.main" : "action.active",
          }}
        />
      }
      checkedIcon={
        <TaskAltOutlinedIcon
          sx={{
            color: task._timelineFlags.today ? "info.main" : "action.active",
          }}
        />
      }
    />
  );
}

const TaskListItem = forwardRef<
  HTMLDivElement,
  Pick<
    TimelineItemProps,
    "task" | "focused" | "onDelete" | "onClick" | "onCheckboxClick"
  >
>((props, ref) => {
  const { task, focused, onClick, onDelete, onCheckboxClick } = props;
  const { language } = useSettings();

  const handleDeleteClick: IconButtonProps["onClick"] = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      onCheckboxClick();
    }
  };

  return (
    <ListItem
      component="div"
      disablePadding
      secondaryAction={
        <IconButton tabIndex={-1} edge="end" onClick={handleDeleteClick}>
          <DeleteOutlineOutlinedIcon />
        </IconButton>
      }
    >
      <ListItemButton
        data-testid="task-button"
        sx={{ borderRadius: 1, pl: { xs: 0, sm: 2 } }}
        ref={ref}
        onClick={onClick}
        onKeyUp={handleKey}
        aria-current={focused}
      >
        <Box>
          <TaskBody task={task} />
          <Box sx={{ display: "flex", gap: 1 }}>
            {task.dueDate && !task.completionDate && (
              <DateBox
                sx={{
                  color: "warning.main",
                  display: {
                    xs: "flex",
                    sm: task._timelineFlags.today ? "flex" : "none",
                  },
                }}
              >
                <AccessAlarmOutlinedIcon fontSize="small" />
                {formatLocaleDate(task.dueDate, language)}
              </DateBox>
            )}
            {task.completionDate && (
              <DateBox
                sx={{
                  color: "text.disabled",
                  display: { xs: "flex", sm: "none" },
                }}
              >
                <CheckCircleOutlinedIcon fontSize="small" />
                {formatLocaleDate(task.completionDate, language)}
              </DateBox>
            )}
            {task.creationDate && !task.dueDate && !task.completionDate && (
              <DateBox
                sx={{
                  color: "text.secondary",
                  display: { xs: "flex", sm: "none" },
                }}
              >
                <AccessTimeOutlinedIcon fontSize="small" />
                {formatLocaleDate(task.creationDate, language)}
              </DateBox>
            )}
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );
});

const TaskTimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  (props, ref) => {
    const {
      task,
      focused,
      onClick,
      onCheckboxClick,
      onDelete,
      onFocus,
      onBlur,
    } = props;

    return (
      <TimelineItem sx={{ minHeight: 0 }} onFocus={onFocus} onBlur={onBlur}>
        <TimelineOppositeContent
          sx={{
            flex: 0,
            pl: 0,
            pr: 1,
            pt: { xs: 2, sm: task._timelineFlags.firstOfYear ? 9 : 2 },
            display: {
              xs: "none",
              sm: "block",
            },
          }}
        >
          <TaskOppositeContent task={task} />
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineConnector
            sx={{
              flexGrow: 0,
              pt: "10px",
              bgcolor:
                task._timelineFlags.today && !task._timelineFlags.firstOfToday
                  ? "info.main"
                  : "action.disabled",
              visibility: task._timelineFlags.first ? "hidden" : "visible",
            }}
          />
          <YearChip task={task} />
          <TaskCheckbox onClick={onCheckboxClick} task={task} />
          <TimelineConnector
            sx={{
              bgcolor:
                task._timelineFlags.today && !task._timelineFlags.lastOfToday
                  ? "info.main"
                  : "action.disabled",
              visibility: task._timelineFlags.last ? "hidden" : "visible",
            }}
          />
        </TimelineSeparator>
        <TimelineContent
          sx={{
            pt: { xs: 1, sm: task._timelineFlags.firstOfYear ? 8 : 1 },
            pb: 1,
            px: 0,
          }}
        >
          <TaskListItem
            ref={ref}
            task={task}
            focused={focused}
            onDelete={onDelete}
            onClick={onClick}
            onCheckboxClick={onCheckboxClick}
          />
        </TimelineContent>
      </TimelineItem>
    );
  }
);

export default TaskTimelineItem;
