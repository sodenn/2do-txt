import { ScrollTo } from "@/components/ScrollTo";
import { TaskBody } from "@/components/TaskBody";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { formatLocaleDate, todayDate } from "@/utils/date";
import { Task } from "@/utils/task";
import { TimelineTask } from "@/utils/task-list";
import { useMobileScreen } from "@/utils/useMobileScreen";
import { useTask } from "@/utils/useTask";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Delete } from "@mui/icons-material";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Box,
  BoxProps,
  Chip,
  IconButton,
  IconButtonProps,
  ListItem,
  ListItemButton,
  Typography,
  styled,
} from "@mui/joy";
import { format } from "date-fns";
import {
  KeyboardEvent,
  MutableRefObject,
  forwardRef,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

interface TaskTimelineProps {
  tasks: TimelineTask[];
  focusedTaskId?: string;
  listItemsRef: MutableRefObject<HTMLDivElement[]>;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onListItemClick: (task: Task) => void;
}

interface WithTimelineTask {
  task: TimelineTask;
}

interface TimelineItemProps extends BoxProps {
  chip?: boolean;
}

type TaskCheckboxProps = WithTimelineTask & IconButtonProps;

interface TaskItemProps extends WithTimelineTask {
  focused: boolean;
  onClick: () => void;
  onCheckboxClick: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

interface YearChipProps {
  date: string;
}

const locales = {
  de: "d. LLL.",
  en: "d LLL",
};

const Root = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    "--IconButton-size": "2rem",
    display: "block",
    justifyContent: "unset",
  },
  [theme.breakpoints.up("sm")]: {
    "--IconButton-size": "2.25rem",
    display: "flex",
    justifyContent: "center",
  },
}));

const dateColumnWidth = 120;

const TaskContainer = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    left: -2, // align with menu button on mobile
  },
  [theme.breakpoints.up("sm")]: {
    left: -(dateColumnWidth / 2), // ignore date column when centering the timeline
  },
}));

export function TaskTimeline(props: TaskTimelineProps) {
  const {
    tasks,
    focusedTaskId,
    listItemsRef,
    onFocus,
    onBlur,
    onListItemClick,
  } = props;
  const { t } = useTranslation();
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );
  const { deleteTask, completeTask } = useTask();
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const [parent] = useAutoAnimate<HTMLDivElement>();
  const [addButtonElem, setAddButtonElem] = useState<HTMLButtonElement | null>(
    null,
  );

  const handleDelete = (task: Task) => {
    openConfirmationDialog({
      title: t("Delete task"),
      content: t("Are you sure you want to delete this task?"),
      buttons: [
        {
          text: t("Delete"),
          color: "danger",
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
      <Typography sx={{ pt: 1, px: 2, pb: 3 }} level="body-md" color="neutral">
        {t("No tasks found")}
      </Typography>
    );
  }

  return (
    <Root>
      <TaskContainer data-testid="task-list" ref={parent}>
        {tasks.map((task, index) => (
          <div key={task._id}>
            {!task._timelineFlags.firstOfToday && (
              <TaskItem
                ref={(el) => {
                  if (listItemsRef.current && el) {
                    const notFocusablePredecessor = tasks.some(
                      (t, idx) => t._timelineFlags.firstOfToday && idx < index,
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
              <TodayItem ref={setAddButtonElem} task={task} />
            )}
          </div>
        ))}
        {addButtonElem && <ScrollTo target={addButtonElem} />}
      </TaskContainer>
    </Root>
  );
}

const TodayItem = forwardRef<HTMLButtonElement, WithTimelineTask>(
  ({ task }, ref) => {
    const { _timelineFlags: flags } = task;
    const mobileScreen = useMobileScreen();
    const { t } = useTranslation();
    const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);
    const today = todayDate();
    const date = format(today, "yyyy");

    const handleClick = () => openTaskDialog();

    return (
      <TimelineItem chip={flags.firstOfYear}>
        {flags.first && <Box sx={{ pt: 2 }} />}
        {!flags.first && <TimelineConnector sx={{ gridArea: "connector" }} />}
        {flags.firstOfYear && <YearChip date={date} />}
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gridArea: "action",
          }}
        >
          <IconButton
            ref={ref}
            onClick={handleClick}
            color="primary"
            variant="plain"
            size={mobileScreen ? "sm" : "md"}
          >
            <AddIcon />
          </IconButton>
          <TimelineConnector
            sx={{
              ...(!flags.lastOfToday && {
                borderColor: "primary.outlinedBorder",
              }),
            }}
          />
        </Box>
        <TimelineContent
          tabIndex={-1}
          sx={{
            height: "var(--IconButton-size)",
            pr: 2,
          }}
          onClick={handleClick}
        >
          <Typography color="primary" level="title-md">
            {t("Add new task")}
          </Typography>
        </TimelineContent>
        <TimelineDate sx={{ color: "primary.plainColor" }}>
          {t("Today")}
        </TimelineDate>
      </TimelineItem>
    );
  },
);

const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>((props, ref) => {
  const {
    task: { _timelineFlags: flags, _timelineDate: timelineDate },
    onCheckboxClick,
  } = props;
  return (
    <TimelineItem data-testid="task" chip={flags.firstOfYear && !!timelineDate}>
      {flags.first && <Box sx={{ pt: 2 }} />}
      {!flags.first && (
        <TimelineConnector
          sx={{
            ...(flags.today &&
              !flags.firstOfToday && {
                borderColor: "primary.outlinedBorder",
              }),
            gridArea: "connector",
          }}
        />
      )}
      {flags.firstOfYear && timelineDate && (
        <YearChip date={format(timelineDate, "yyyy")} />
      )}
      <TaskCheckbox onClick={onCheckboxClick} task={props.task} />
      <TaskContent ref={ref} {...props} />
      <TaskDate task={props.task} />
    </TimelineItem>
  );
});

const TaskContent = forwardRef<HTMLDivElement, TaskItemProps>((props, ref) => {
  const { task, focused, onClick, onDelete, onCheckboxClick, onFocus, onBlur } =
    props;
  const { language } = useSettingsStore();

  const handleDeleteClick: IconButtonProps["onClick"] = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code === "Space") {
      event.preventDefault();
      event.stopPropagation();
      onCheckboxClick();
    }
  };

  const handleClick = (event: any) => {
    if (event.code === "Space") {
      onCheckboxClick();
    } else {
      onClick();
    }
  };

  return (
    <StyledListItem
      endAction={
        <IconButton
          tabIndex={-1}
          role="button"
          aria-label="Delete task"
          size="sm"
          className="DeleteButton"
          onClick={handleDeleteClick}
        >
          <Delete />
        </IconButton>
      }
    >
      <TimelineContent
        data-testid="task-button"
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        aria-current={focused}
        sx={{
          alignSelf: "auto",
          minHeight: "var(--IconButton-size)",
          pr: "calc(var(--IconButton-size) + 8px)",
        }}
      >
        <div>
          <TaskBody task={task} />
          <Box sx={{ display: "flex", gap: 1 }}>
            {task.dueDate && !task.completionDate && (
              <Typography
                color="warning"
                sx={{
                  display: {
                    xs: "flex",
                    sm: task._timelineFlags.today ? "flex" : "none",
                  },
                  alignItems: "center",
                  fontSize: "0.9em",
                  gap: 0.5,
                }}
              >
                <AccessAlarmIcon fontSize="small" />
                {formatLocaleDate(task.dueDate, language)}
              </Typography>
            )}
            {task.completionDate && (
              <Typography
                color="completed"
                variant="plain"
                sx={{
                  display: { xs: "flex", sm: "none" },
                  alignItems: "center",
                  fontSize: "0.9em",
                  gap: 0.5,
                }}
              >
                <CheckCircleIcon fontSize="small" />
                {formatLocaleDate(task.completionDate, language)}
              </Typography>
            )}
            {task.creationDate && !task.dueDate && !task.completionDate && (
              <Typography
                color="neutral"
                sx={{
                  display: { xs: "flex", sm: "none" },
                  alignItems: "center",
                  fontSize: "0.9em",
                  gap: 0.5,
                }}
              >
                <AccessTimeIcon fontSize="small" />
                {formatLocaleDate(task.creationDate, language)}
              </Typography>
            )}
          </Box>
        </div>
      </TimelineContent>
    </StyledListItem>
  );
});

function TaskCheckbox({
  task: { completed, _timelineFlags: flags },
  ...other
}: TaskCheckboxProps) {
  const mobileScreen = useMobileScreen();
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gridArea: "action",
      }}
    >
      <IconButton
        size={mobileScreen ? "sm" : "md"}
        variant="plain"
        tabIndex={-1}
        color={flags.today ? "primary" : "neutral"}
        aria-label="Complete task"
        aria-checked={completed}
        {...other}
      >
        {!completed && <RadioButtonUncheckedIcon />}
        {completed && <TaskAltIcon />}
      </IconButton>
      <TimelineConnector
        sx={{
          visibility: flags.last ? "hidden" : "visible",
          ...(flags.today &&
            !flags.lastOfToday && {
              borderColor: "primary.outlinedBorder",
            }),
        }}
      />
    </Box>
  );
}

function YearChip({ date }: YearChipProps) {
  return (
    <Chip sx={{ gridArea: "chip", mt: 0.5 }} size="sm">
      {date}
    </Chip>
  );
}

function TaskDate({ task }: WithTimelineTask) {
  const {
    _timelineFlags: flags,
    _timelineDate: timelineDate,
    dueDate,
    completionDate,
  } = task;
  const language = useSettingsStore((state) => state.language);
  const { t } = useTranslation();
  return (
    <TimelineDate
      color="neutral"
      sx={{
        visibility:
          flags.firstOfDay || flags.firstWithoutDate ? "visible" : "hidden",
      }}
    >
      {!!dueDate && !completionDate && <AccessAlarmIcon fontSize="small" />}
      {timelineDate && format(timelineDate, locales[language])}
      {flags.firstWithoutDate && t("Without date")}
    </TimelineDate>
  );
}

const TimelineDate = styled(Typography)(({ theme }) => ({
  width: dateColumnWidth,
  justifyContent: "right",
  alignItems: "center",
  gap: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
  [theme.breakpoints.up("sm")]: {
    display: "inline-flex",
    height: "var(--IconButton-size)",
  },
  gridArea: "date",
  fontSize: "0.9em",
}));

function TimelineItem(props: TimelineItemProps) {
  const { sx, chip, ...other } = props;

  const gridTemplateAreas = [
    `". connector ."`,
    ...(chip ? [`". chip ."`] : []),
    `"date action content"`,
  ].join("\n");

  return (
    <Box
      sx={{
        display: "grid",
        justifyItems: "center",
        gap: 0.5,
        gridTemplateColumns: "auto 50px 1fr",
        gridTemplateAreas: gridTemplateAreas,
        mt: -1,
        mb: -1,
        ...sx,
      }}
      {...other}
    />
  );
}

const TimelineContent = styled(ListItemButton)(({ theme }) => ({
  width: "100%",
  borderRadius: theme.vars.radius.sm,
  gridArea: "content",
  "@media (pointer: coarse)": {
    '&:not(.Mui-selected, [aria-selected="true"]):active': {
      backgroundColor: "inherit",
    },
    ':not(.Mui-selected, [aria-selected="true"]):hover': {
      backgroundColor: "inherit",
    },
  },
  [theme.breakpoints.down("sm")]: {
    paddingTop: 1,
    paddingBottom: 1,
  },
  [theme.breakpoints.up("sm")]: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: theme.spacing(2),
  },
}));
TimelineContent.defaultProps = {
  variant: "plain",
};

const TimelineConnector = styled(Box)(({ theme }) => ({
  minHeight: 12,
  borderWidth: 2,
  borderColor: theme.vars.palette.neutral.outlinedBorder,
  borderStyle: "solid",
  borderRadius: theme.vars.radius.sm,
  flex: 1,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  width: "100%",
  gridArea: "content",
  alignSelf: "flex-start",
  ".DeleteButton": {
    visibility: "hidden",
  },
  "@media (pointer: coarse)": {
    ".DeleteButton": {
      visibility: "visible",
    },
  },
  "&:hover .DeleteButton": {
    visibility: "visible",
  },
  ".MuiListItem-endAction": {
    [theme.breakpoints.down("sm")]: {
      top: 0,
    },
    [theme.breakpoints.up("sm")]: {
      top: 2,
    },
    right: 8,
  },
}));
