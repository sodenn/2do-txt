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
  IconButton,
  IconButtonProps,
  ListItem,
  ListItemButton,
  styled,
} from "@mui/material";
import { forwardRef } from "react";
import { Task } from "../utils/task";
import TaskBody from "./TaskBody";
import TaskDates from "./TaskDates";

interface TimelineItemProps {
  task: Task;
  hideTopConnector: boolean;
  hideBottomConnector: boolean;
  focused: boolean;
  onClick: () => void;
  onCheckboxClick: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const StyledButton = styled(ListItemButton)(({ theme }) => ({
  "&.MuiListItemButton-root": {
    display: "block",
    borderRadius: theme.shape.borderRadius,
    [theme.breakpoints.down("sm")]: {
      padding: `${theme.spacing(1)} 0`,
    },
    [theme.breakpoints.up("sm")]: {
      padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    },
    ".MuiIconButton-root": {
      visibility: "hidden",
    },
    "@media (pointer: coarse)": {
      ".MuiIconButton-root": {
        visibility: "visible",
      },
    },
    "&:hover": {
      ".MuiIconButton-root": {
        visibility: "visible",
      },
    },
  },
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
      hideTopConnector,
      hideBottomConnector,
    } = props;

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
        <TimelineOppositeContent sx={{ flex: 0, p: 0 }} />
        <TimelineSeparator>
          <TimelineConnector
            sx={{
              flexGrow: 0,
              pt: "10px",
              bgcolor: "primary.main",
              visibility: hideTopConnector ? "hidden" : "visible",
            }}
          />
          <Checkbox
            size="small"
            tabIndex={-1}
            onClick={onCheckboxClick}
            checked={task.completed}
            icon={<RadioButtonUncheckedOutlinedIcon color="primary" />}
            checkedIcon={<RadioButtonCheckedOutlinedIcon color="primary" />}
          />
          <TimelineConnector
            sx={{
              bgcolor: "primary.main",
              visibility: hideBottomConnector ? "hidden" : "visible",
            }}
          />
        </TimelineSeparator>
        <TimelineContent sx={{ pl: 0, py: 1, px: { xs: 0, sm: 0.5 } }}>
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
