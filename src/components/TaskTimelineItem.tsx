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
import { forwardRef } from "react";
import { useSettings } from "../data/SettingsContext";
import { formatDateRelative, formatLocaleDate } from "../utils/date";
import { TimelineTask } from "../utils/task-list";
import TaskBody from "./TaskBody";

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

const PriorityBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: `0 ${theme.spacing(0.5)}`,
  outline: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: theme.spacing(1),
  color: theme.palette.secondary.main,
  ...theme.typography.body2,
}));

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
    const { language } = useSettings();

    const handleDeleteClick: IconButtonProps["onClick"] = (e) => {
      e.stopPropagation();
      onDelete();
    };

    return (
      <TimelineItem
        sx={{ minHeight: 0 }}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-current={focused}
      >
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
          <Box
            sx={{
              width: 120,
              display: "inline-flex",
              justifyContent: "right",
              alignItems: "center",
              gap: 1,
              visibility:
                task._timelineFlags.firstOfToday ||
                task._timelineFlags.firstOfDay
                  ? "visible"
                  : "hidden",
              color: task._timelineFlags.firstOfToday
                ? "info.main"
                : task.completionDate
                ? "text.secondary"
                : undefined,
            }}
          >
            {task.priority && <PriorityBox>{task.priority}</PriorityBox>}
            {!!task.dueDate && <AccessAlarmOutlinedIcon fontSize="small" />}
            {task._timelineDate &&
              formatDateRelative(task._timelineDate, language)}
          </Box>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineConnector
            sx={{
              flexGrow: 0,
              pt: "10px",
              bgcolor:
                task._timelineFlags.today && !task._timelineFlags.firstOfToday
                  ? "info.main"
                  : "text.secondary",
              visibility: task._timelineFlags.first ? "hidden" : "visible",
            }}
          />
          <Box
            sx={{
              alignItems: "center",
              flexDirection: "column",
              display: {
                xs: "none",
                sm: "inline-flex",
              },
              visibility: task._timelineFlags.firstOfYear
                ? "visible"
                : "hidden",
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
                    : "text.secondary",
              }}
            />
          </Box>
          <Checkbox
            sx={{ mx: 1 }}
            size="small"
            tabIndex={-1}
            onClick={onCheckboxClick}
            checked={task.completed}
            icon={
              <RadioButtonUncheckedOutlinedIcon
                sx={{
                  color: task._timelineFlags.today
                    ? "info.main"
                    : "text.secondary",
                }}
              />
            }
            checkedIcon={
              <TaskAltOutlinedIcon
                sx={{
                  color: task._timelineFlags.today
                    ? "info.main"
                    : "text.secondary",
                }}
              />
            }
          />
          <TimelineConnector
            sx={{
              bgcolor:
                task._timelineFlags.today && !task._timelineFlags.lastOfToday
                  ? "info.main"
                  : "text.secondary",
              visibility: task._timelineFlags.last ? "hidden" : "visible",
            }}
          />
        </TimelineSeparator>
        <TimelineContent
          sx={{
            pl: 0,
            pt: { xs: 1, sm: task._timelineFlags.firstOfYear ? 8 : 1 },
            px: { xs: 0, sm: 0.5 },
          }}
        >
          <ListItem
            component="div"
            disablePadding
            secondaryAction={
              <IconButton tabIndex={-1} edge="end" onClick={handleDeleteClick}>
                <DeleteOutlineOutlinedIcon sx={{ color: "text.secondary" }} />
              </IconButton>
            }
          >
            <ListItemButton
              sx={{ borderRadius: 1 }}
              ref={ref}
              onClick={onClick}
            >
              <Box>
                <TaskBody task={task} />
                <Box sx={{ display: "flex", gap: 1 }}>
                  {task.dueDate && (
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
                  {task.completionDate && !task.dueDate && (
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
                    <DateBox sx={{ color: "text.secondary" }}>
                      <AccessTimeOutlinedIcon fontSize="small" />
                      {formatLocaleDate(task.creationDate, language)}
                    </DateBox>
                  )}
                  {task.priority && (
                    <PriorityBox
                      sx={{
                        display: { xs: "flex", sm: "none" },
                      }}
                    >
                      {task.priority}
                    </PriorityBox>
                  )}
                </Box>
              </Box>
            </ListItemButton>
          </ListItem>
        </TimelineContent>
      </TimelineItem>
    );
  }
);

export default TaskTimelineItem;
