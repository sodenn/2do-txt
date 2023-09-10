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
import AccessAlarmOutlinedIcon from "@mui/icons-material/AccessAlarmOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
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
  ListItemButtonProps,
  Typography,
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

interface TodayItemProps {
  flags: TimelineTask["_timelineFlags"];
}

interface TaskDateProps {
  flags: TimelineTask["_timelineFlags"];
  timelineDate?: Date;
  dueDate?: Date;
  completionDate?: Date;
}

interface TimelineItemProps extends BoxProps {
  chip?: boolean;
}

interface TaskCheckboxProps extends IconButtonProps {
  task: TimelineTask;
}

interface TimelineConnectorProps extends BoxProps {
  pos: "top" | "mid" | "bottom";
}

interface TaskItemProps {
  task: TimelineTask;
  focused: boolean;
  onClick: () => void;
  onCheckboxClick: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const locales = {
  de: "d. LLL.",
  en: "d LLL",
};

function TaskDate({
  flags,
  timelineDate,
  dueDate,
  completionDate,
}: TaskDateProps) {
  const language = useSettingsStore((state) => state.language);
  const { t } = useTranslation();
  return (
    <Typography
      color="neutral"
      sx={{
        width: 120,
        justifyContent: "right",
        alignItems: "center",
        gap: 1,
        visibility:
          flags.firstOfDay || flags.firstWithoutDate ? "visible" : "hidden",
        display: {
          xs: "none",
          sm: "inline-flex",
        },
        gridArea: "date",
      }}
    >
      {!!dueDate && !completionDate && (
        <AccessAlarmOutlinedIcon fontSize="small" />
      )}
      {timelineDate && format(timelineDate, locales[language])}
      {flags.firstWithoutDate && t("Without date")}
    </Typography>
  );
}

function TimelineItem(props: TimelineItemProps) {
  const { sx, chip, ...other } = props;

  const gridTemplateAreas = [
    `". connectorTop ."`,
    ...(chip ? [`". chip ."`] : []),
    ...(chip ? [`". connectorMid ."`] : []),
    `"date action content"`,
    `". connectorBottom content"`,
  ].join("\n");

  return (
    <Box
      sx={{
        display: "grid",
        justifyItems: "center",
        gap: 0.6,
        gridTemplateColumns: "auto 50px 1fr",
        gridTemplateAreas: gridTemplateAreas,
        marginTop: "-2px",
        marginBottom: "-2px",
        ...sx,
      }}
      {...other}
    />
  );
}

const TimelineContent = forwardRef<HTMLDivElement, ListItemButtonProps>(
  (props, ref) => {
    const { sx, ...other } = props;
    return (
      <ListItemButton
        ref={ref}
        variant="plain"
        sx={{
          width: "100%",
          borderRadius: "sm",
          gridArea: "content",
          px: { xs: 0, sm: 1 },
          py: 1,
          ...sx,
        }}
        {...other}
      />
    );
  },
);

function TimelineConnector(props: TimelineConnectorProps) {
  const { sx, pos, ...other } = props;
  return (
    <Box
      sx={{
        minHeight: 8,
        borderWidth: "2px",
        borderColor: "neutral.softBg",
        borderStyle: "solid",
        borderRadius: "sm",
        flex: 1,
        gridArea:
          pos === "top"
            ? "connectorTop"
            : pos === "mid"
            ? "connectorMid"
            : "connectorBottom",
        ...sx,
      }}
      {...other}
    />
  );
}

interface YearChipProps {
  date: string;
}

function YearChip({ date }: YearChipProps) {
  return (
    <Chip sx={{ gridArea: "chip" }} size="sm">
      {date}
    </Chip>
  );
}

function TaskCheckbox({ task, ...other }: TaskCheckboxProps) {
  const mobileScreen = useMobileScreen();
  return (
    <IconButton
      size={mobileScreen ? "sm" : "md"}
      variant="plain"
      tabIndex={-1}
      color={task._timelineFlags.today ? "primary" : "neutral"}
      aria-label="Complete task"
      aria-checked={task.completed}
      sx={{
        gridArea: "action",
      }}
      {...other}
    >
      {!task.completed && <RadioButtonUncheckedIcon />}
      {task.completed && <TaskAltIcon />}
    </IconButton>
  );
}

const TaskContent = forwardRef<HTMLDivElement, TaskItemProps>((props, ref) => {
  const { task, focused, onClick, onDelete, onCheckboxClick, onFocus, onBlur } =
    props;
  const { language } = useSettingsStore();

  const handleDeleteClick: IconButtonProps["onClick"] = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      onCheckboxClick();
    }
  };

  return (
    <ListItem
      endAction={
        <IconButton
          aria-label="Delete"
          size="sm"
          color="danger"
          onClick={handleDeleteClick}
        >
          <Delete />
        </IconButton>
      }
      sx={{
        width: "100%",
        gridArea: "content",
        alignSelf: "flex-start",
        ".MuiListItem-endAction": {
          top: "5px",
          right: "5px",
        },
      }}
    >
      <TimelineContent
        data-testid="task-button"
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        onKeyUp={handleKeyUp}
        aria-current={focused}
        sx={{
          alignSelf: "auto",
          minHeight: {
            xs: "var(--IconButton-size, 2rem)",
            sm: "var(--IconButton-size, 2.5rem)",
          },
          pr: {
            xs: "var(--IconButton-size, 2rem)",
            sm: "var(--IconButton-size, 2.5rem)",
          },
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
                  gap: 0.5,
                }}
              >
                <AccessAlarmOutlinedIcon fontSize="small" />
                {formatLocaleDate(task.dueDate, language)}
              </Typography>
            )}
            {task.completionDate && (
              <Typography
                color="neutral"
                sx={{
                  display: { xs: "flex", sm: "none" },
                  gap: 0.5,
                }}
              >
                <CheckCircleOutlinedIcon fontSize="small" />
                {formatLocaleDate(task.completionDate, language)}
              </Typography>
            )}
            {task.creationDate && !task.dueDate && !task.completionDate && (
              <Typography
                color="neutral"
                sx={{
                  display: { xs: "flex", sm: "none" },
                  gap: 0.5,
                }}
              >
                <AccessTimeOutlinedIcon fontSize="small" />
                {formatLocaleDate(task.creationDate, language)}
              </Typography>
            )}
          </Box>
        </div>
      </TimelineContent>
    </ListItem>
  );
});

const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>((props, ref) => {
  const { task, onCheckboxClick } = props;
  return (
    <TimelineItem
      chip={task._timelineFlags.firstOfYear && !!task._timelineDate}
    >
      <TimelineConnector
        pos="top"
        sx={{
          ...(task._timelineFlags.today &&
            !task._timelineFlags.firstOfToday && {
              borderColor: "primary.softBg",
            }),
        }}
      />
      {task._timelineFlags.firstOfYear && task._timelineDate && (
        <YearChip date={format(task._timelineDate, "yyyy")} />
      )}
      {task._timelineFlags.firstOfYear && task._timelineDate && (
        <TimelineConnector
          sx={{
            minHeight: 16,
            ...(task._timelineFlags.today &&
              !task._timelineFlags.firstOfToday && {
                borderColor: "primary.softBg",
              }),
          }}
          pos="mid"
        />
      )}
      <TaskCheckbox onClick={onCheckboxClick} task={task} />
      <TimelineConnector
        pos="bottom"
        sx={{
          ...(task._timelineFlags.today &&
            !task._timelineFlags.lastOfToday && {
              borderColor: "primary.softBg",
            }),
        }}
      />
      <TaskContent ref={ref} {...props} />
      <TaskDate
        flags={task._timelineFlags}
        timelineDate={task._timelineDate}
        completionDate={task.completionDate}
        dueDate={task.dueDate}
      />
    </TimelineItem>
  );
});

const TodayItem = forwardRef<HTMLButtonElement, TodayItemProps>(
  ({ flags }, ref) => {
    const mobileScreen = useMobileScreen();
    const { t } = useTranslation();
    const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);
    const today = todayDate();
    const date = format(today, "yyyy");

    const handleClick = () => openTaskDialog();

    return (
      <TimelineItem chip={flags.firstOfYear}>
        <TimelineConnector sx={{ borderColor: "primary.softBg" }} pos="top" />
        {flags.firstOfYear && <YearChip date={date} />}
        {flags.firstOfYear && (
          <TimelineConnector
            sx={{ borderColor: "primary.softBg", minHeight: 16 }}
            pos="mid"
          />
        )}
        <IconButton
          ref={ref}
          sx={{ gridArea: "action" }}
          onClick={handleClick}
          color="primary"
          variant="plain"
          size={mobileScreen ? "sm" : "md"}
        >
          <AddOutlinedIcon />
        </IconButton>
        <TimelineConnector
          sx={{ borderColor: "primary.softBg" }}
          pos="bottom"
        />
        <TimelineContent
          sx={{
            height: {
              xs: "var(--IconButton-size, 2rem)",
              sm: "var(--IconButton-size, 2.5rem)",
            },
          }}
          onClick={handleClick}
        >
          <Typography color="primary" level="title-md">
            {t("Add task for today")}
          </Typography>
        </TimelineContent>
        <TaskDate flags={flags} />
      </TimelineItem>
    );
  },
);

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
        color="secondary"
      >
        {t("No tasks found")}
      </Typography>
    );
  }

  return (
    <Box sx={{ pb: 4 }} aria-label="Task list" ref={parent}>
      {tasks.map((task, index) => (
        <Box
          data-testid={!task._timelineFlags.firstOfToday ? "task" : undefined}
          key={task._id}
        >
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
            <TodayItem ref={setAddButtonElem} flags={task._timelineFlags} />
          )}
          {addButtonElem && <ScrollTo target={addButtonElem} />}
        </Box>
      ))}
    </Box>
  );
}
