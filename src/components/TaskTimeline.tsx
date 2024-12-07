import { ScrollTo } from "@/components/ScrollTo";
import { TaskBody } from "@/components/TaskBody";
import { Button, ButtonProps } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { listItemVariants } from "@/components/ui/list";
import { useFilterStore } from "@/stores/filter-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { formatLocaleDate, todayDate } from "@/utils/date";
import { HAS_TOUCHSCREEN } from "@/utils/platform";
import { Task } from "@/utils/task";
import { TimelineTask } from "@/utils/task-list";
import { cn } from "@/utils/tw-utils";
import { useTask } from "@/utils/useTask";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { format } from "date-fns";
import {
  BellIcon,
  CheckCircleIcon,
  CircleCheckBigIcon,
  CircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

interface TaskTimelineProps {
  tasks: TimelineTask[];
  focusedTaskId?: string;
  listItemsRef: RefObject<HTMLDivElement[]>;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onListItemClick: (task: Task) => void;
}

interface WithTimelineTask {
  task: TimelineTask;
}

interface TimelineItemProps extends HTMLAttributes<HTMLDivElement> {
  chip?: boolean;
}

type TaskCheckboxProps = WithTimelineTask & Pick<ButtonProps, "onClick">;

interface TaskItemProps extends WithTimelineTask {
  focused: boolean;
  onClick: () => void;
  onCheckboxClick: () => void;
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
  const { toggleCompleteTask } = useTask();
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const [parent] = useAutoAnimate<HTMLDivElement>();
  const [addButtonElem, setAddButtonElem] = useState<HTMLButtonElement | null>(
    null,
  );

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
      <div className="px-5 pb-4 text-muted-foreground">{t("No tasks")}</div>
    );
  }

  return (
    <div
      ref={parent}
      className="flex flex-col pb-4 sm:justify-center"
      data-testid="task-list"
    >
      {tasks.map((task, index) => (
        <div key={task.id}>
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
              onCheckboxClick={() => toggleCompleteTask(task)}
              focused={focusedTaskId === task.id}
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
    </div>
  );
}

const TodayItem = forwardRef<HTMLButtonElement, WithTimelineTask>(
  ({ task }, ref) => {
    const { _timelineFlags: flags } = task;
    const { t } = useTranslation();
    const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);
    const today = todayDate();
    const date = format(today, "yyyy");

    const handleClick = () => openTaskDialog();

    return (
      <TimelineItem chip={flags.firstOfYear}>
        {flags.first && <div className="pt-2" />}
        {!flags.first && (
          <TimelineConnector
            className="justify-self-center"
            style={{ gridArea: "connector" }}
          />
        )}
        {flags.firstOfYear && <YearChip date={date} />}
        <div
          className="flex flex-col items-center justify-center gap-0.5"
          style={{
            gridArea: "action",
          }}
        >
          <Button
            tabIndex={-1}
            ref={ref}
            onClick={handleClick}
            className="text-primary"
            variant="ghost"
            size="icon"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          <TimelineConnector
            className={cn(
              "-mb-[3px] mt-2",
              !flags.lastOfToday && "border-primary",
            )}
          />
        </div>
        <div className="self-start" style={{ gridArea: "content" }}>
          <Button variant="ghost" tabIndex={-1} onClick={handleClick}>
            {t("Add new task")}
          </Button>
        </div>
        <TimelineDate className="text-primary">{t("Today")}</TimelineDate>
      </TimelineItem>
    );
  },
);

const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>((props, ref) => {
  const {
    task: { _timelineFlags: flags, _timelineDate: timelineDate },
    onCheckboxClick,
  } = props;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code === "Space") {
      event.preventDefault();
    }
  };

  return (
    <TimelineItem
      onKeyDown={handleKeyDown}
      chip={flags.firstOfYear && !!timelineDate}
    >
      {flags.first && <div className="pt-2" />}
      {!flags.first && (
        <TimelineConnector
          className={cn(
            "mb-1 justify-self-center",
            flags.today && !flags.firstOfToday && "border-primary",
          )}
          style={{
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
  const { task, focused, onClick, onCheckboxClick, onFocus, onBlur } = props;
  const { language } = useSettingsStore();
  const { deleteTaskWithConfirmation } = useTask();

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code === "Space") {
      event.preventDefault();
      event.stopPropagation();
      onCheckboxClick();
    }
    if (event.code === "Enter") {
      onClick();
    }
  };

  const handleDelete = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      if (task) {
        deleteTaskWithConfirmation(task);
      }
    },
    [deleteTaskWithConfirmation, task],
  );

  return (
    <div
      tabIndex={0}
      role="button"
      className={cn(
        listItemVariants({
          variant: "default",
          className:
            "group relative w-full cursor-pointer self-start sm:px-5" +
            (!HAS_TOUCHSCREEN ? " pr-14 sm:pr-14" : ""),
          selected: false,
        }),
      )}
      data-testid="task"
      ref={ref}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
      onKeyUp={handleKeyUp}
      aria-current={focused}
      style={{ gridArea: "content" }}
    >
      <div>
        <TaskBody task={task} />
        <div className="flex gap-1">
          {task.dueDate && !task.completionDate && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[0.9em] text-warning",
                !task._timelineFlags.today && "sm:hidden",
              )}
            >
              <BellIcon className="mr-2 h-4 w-4" />
              {formatLocaleDate(task.dueDate, language)}
            </div>
          )}
          {task.completionDate && (
            <div className="flex gap-0.5 text-[0.9em] text-muted-foreground sm:hidden">
              <CheckCircleIcon className="mr-2 h-4 w-4" />
              {formatLocaleDate(task.completionDate, language)}
            </div>
          )}
          {task.creationDate && !task.dueDate && !task.completionDate && (
            <div className="flex items-center gap-0.5 text-[0.9em] text-muted-foreground sm:hidden">
              <ClockIcon className="mr-2 h-4 w-4" />
              {formatLocaleDate(task.creationDate, language)}
            </div>
          )}
        </div>
        {!HAS_TOUCHSCREEN && (
          <Button
            aria-label="Delete task"
            onClick={handleDelete}
            role="button"
            size="icon"
            variant="ghost"
            className="absolute bottom-0 right-4 top-0 m-auto opacity-0 transition-opacity duration-100 ease-in-out focus-visible:opacity-50 group-hover:opacity-50 group-focus-visible:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

function TaskCheckbox({
  task: { completed, _timelineFlags: flags },
  onClick,
}: TaskCheckboxProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-0.5 self-start"
      style={{
        gridArea: "action",
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        tabIndex={-1}
        color={flags.today ? "primary" : "neutral"}
        aria-label="Complete task"
        aria-checked={completed}
        onClick={onClick}
        className="h-10 w-10"
      >
        {!completed && <CircleIcon className="h-4 w-4 bg-background" />}
        {completed && <CircleCheckBigIcon className="h-4 w-4 bg-background" />}
      </Button>
      <TimelineConnector
        className={cn(
          "-mb-[3px] mt-1 flex-1",
          flags.today && !flags.lastOfToday && "border-primary",
          flags.last ? "invisible" : "visible",
        )}
      />
    </div>
  );
}

function YearChip({ date }: YearChipProps) {
  return (
    <div style={{ gridArea: "chip" }}>
      <Chip className="my-1" size="sm">
        {date}
      </Chip>
    </div>
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
      className={cn(
        flags.firstOfDay || flags.firstWithoutDate ? "visible" : "invisible",
      )}
    >
      {!!dueDate && !completionDate && <BellIcon className="mr-2 h-4 w-4" />}
      {timelineDate && format(timelineDate, locales[language])}
      {flags.firstWithoutDate && t("Without date")}
    </TimelineDate>
  );
}

function TimelineDate(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...other } = props;
  return (
    <div
      className={cn(
        "hidden h-[36px] w-[120px] items-center justify-end gap-1 self-start text-[0.9em] sm:inline-flex",
        className,
      )}
      style={{
        gridArea: "date",
      }}
      {...other}
    />
  );
}

const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  (props, ref) => {
    const { className, chip, ...other } = props;

    const gridTemplateAreas = [
      `". connector ."`,
      ...(chip ? [`". chip ."`] : []),
      `"date action content"`,
    ].join("\n");

    return (
      <div
        ref={ref}
        className={cn("grid items-center gap-0.5", className)}
        style={{
          gridTemplateColumns: "auto 50px 1fr",
          gridTemplateAreas: gridTemplateAreas,
        }}
        {...other}
      />
    );
  },
);

function TimelineConnector({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-[14px] rounded border-2 border-solid",
        className,
      )}
      {...props}
    />
  );
}
