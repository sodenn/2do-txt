import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RadioButtonCheckedOutlinedIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
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
} from "@mui/material";
import { format } from "date-fns";
import { forwardRef } from "react";
import { useSettings } from "../data/SettingsContext";
import { formatDateRelative } from "../utils/date";
import { TimelineTask } from "../utils/task-list";
import TaskBody from "./TaskBody";
import TaskDates from "./TaskDates";

interface TimelineItemProps {
  task: TimelineTask;
  focused: boolean;
  onClick: () => void;
  onCheckboxClick: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

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
            px: 0,
            pt: { xs: 2, sm: task._timelineFlags.firstOfYear ? 10 : 2 },
          }}
        >
          <Box
            sx={{
              width: 100,
              display: {
                xs: "hidden",
                sm: "block",
              },
              visibility:
                task._timelineFlags.firstOfToday ||
                task._timelineFlags.firstOfDay
                  ? "visible"
                  : "hidden",
              color: task._timelineFlags.firstOfToday
                ? "primary.main"
                : undefined,
            }}
          >
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
                  ? "primary.main"
                  : "text.secondary",
              visibility: task._timelineFlags.first ? "hidden" : "visible",
            }}
          />
          <Box
            sx={{
              width: "60px",
              alignItems: "center",
              flexDirection: "column",
              display: {
                xs: "hidden",
                sm: "inline-flex",
              },
              visibility: task._timelineFlags.firstOfYear
                ? "visible"
                : "hidden",
              height: !task._timelineFlags.firstOfYear ? "1px" : undefined,
            }}
          >
            <Chip
              sx={{ my: 1 }}
              label={task._timelineDate && format(task._timelineDate, "yyyy")}
            />
            <TimelineConnector
              sx={{
                flexGrow: 0,
                pt: 2,
                bgcolor:
                  task._timelineFlags.today && !task._timelineFlags.firstOfToday
                    ? "primary.main"
                    : "text.secondary",
              }}
            />
          </Box>
          <Checkbox
            size="small"
            tabIndex={-1}
            onClick={onCheckboxClick}
            checked={task.completed}
            icon={
              <RadioButtonUncheckedOutlinedIcon
                color={task._timelineFlags.today ? "primary" : "action"}
              />
            }
            checkedIcon={
              <RadioButtonCheckedOutlinedIcon
                color={task._timelineFlags.today ? "primary" : "action"}
              />
            }
          />
          <TimelineConnector
            sx={{
              bgcolor:
                task._timelineFlags.today && !task._timelineFlags.lastOfToday
                  ? "primary.main"
                  : "text.secondary",
              visibility: task._timelineFlags.last ? "hidden" : "visible",
            }}
          />
        </TimelineSeparator>
        <TimelineContent
          sx={{
            pl: 0,
            pt: { xs: 1, sm: task._timelineFlags.firstOfYear ? 9 : 1 },
            px: { xs: 0, sm: 0.5 },
          }}
        >
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
              sx={{ borderRadius: 1 }}
              ref={ref}
              onClick={onClick}
            >
              <Box>
                <TaskBody task={task} />
                <TaskDates task={task} />
              </Box>
            </ListItemButton>
          </ListItem>
        </TimelineContent>
      </TimelineItem>
    );
  }
);

export default TaskTimelineItem;
