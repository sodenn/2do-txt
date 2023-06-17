import { Box, Button, Grid, Stack } from "@mui/material";
import { isValid } from "date-fns";
import { useBeautifulMentions } from "lexical-beautiful-mentions";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { hasTouchScreen } from "../native-api/platform";
import usePlatformStore from "../stores/platform-store";
import { formatDate, isDateEqual } from "../utils/date";
import {
  Task,
  getDueDateValue,
  getRecValue,
  parseTask,
  stringifyTask,
} from "../utils/task";
import { TaskList } from "../utils/task-list";
import { Editor, EditorContext } from "./Editor";
import FileSelect from "./FileSelect";
import LocalizationDatePicker from "./LocalizationDatePicker";
import PrioritySelect from "./PrioritySelect";
import RecurrenceSelect from "./RecurrenceSelect";

interface TaskFormProps {
  value: string;
  newTask: boolean;
  taskLists: TaskList[];
  projects: string[];
  contexts: string[];
  tags: Record<string, string[]>;
  onChange: (value: string) => void;
  onFileSelect: (value?: TaskList) => void;
  onEnterPress: () => void;
}

interface TaskGridProps
  extends Omit<TaskFormProps, "value" | "projects" | "contexts" | "tags"> {
  items: Record<string, string[]>;
  formModel: Task;
}

const TaskForm = (props: TaskFormProps) => {
  const { value, projects, contexts, tags, ...other } = props;

  const _tags = useMemo(() => {
    const tags = Object.keys(props.tags).reduce((acc, key) => {
      acc[key + ":"] = props.tags[key];
      return acc;
    }, {} as Record<string, string[]>);
    if (Object.keys(tags).every((k) => k !== "due:")) {
      tags["due:"] = [];
    }
    return tags;
  }, [props.tags]);

  const items = useMemo(
    () => ({
      "@": contexts,
      "\\+": projects,
      "\\w+:": [],
      ..._tags,
    }),
    [contexts, projects, _tags]
  );

  const triggers = useMemo(() => Object.keys(items), [items]);

  const formModel = useMemo(() => parseTask(value), [value]);

  return (
    <EditorContext initialValue={formModel.body} triggers={triggers}>
      <TaskGrid {...other} items={items} formModel={formModel} />
    </EditorContext>
  );
};

const TaskGrid = (props: TaskGridProps) => {
  const touchScreen = hasTouchScreen();
  const platform = usePlatformStore((state) => state.platform);
  const {
    formModel,
    newTask: isNewTask,
    items,
    taskLists,
    onChange,
    onFileSelect,
    onEnterPress,
  } = props;
  const { t } = useTranslation();
  const rec = getRecValue(formModel.body);
  const dueDate = getDueDateValue(formModel.body);
  const showCreationDate = isNewTask;
  const showCompletionDate = isNewTask && formModel.completed;
  const mdGridItems =
    (showCreationDate || showCompletionDate) &&
    !(showCreationDate && showCompletionDate)
      ? 4
      : 6;
  const {
    openMentionsMenu,
    removeMentions,
    insertMention,
    renameMentions,
    hasMentions,
  } = useBeautifulMentions();

  const handleDueDateChange = (value: Date | null) => {
    if ((value && !isValid(value)) || isDateEqual(value, dueDate)) {
      return;
    }
    if (value) {
      const trigger = "due:";
      const dateStr = formatDate(value);
      if (hasMentions({ trigger: "due:" })) {
        renameMentions({
          newValue: dateStr,
          trigger,
          focus: false,
        });
      } else {
        insertMention({
          value: dateStr,
          trigger,
          focus: false,
        });
      }
    } else {
      removeMentions({ trigger: "due:", focus: false });
    }
  };

  const handleRecChange = (value: string | null) => {
    if (value) {
      if (hasMentions({ trigger: "rec:" })) {
        renameMentions({
          newValue: value,
          trigger: "rec:",
          focus: false,
        });
      } else {
        insertMention({
          value: value,
          trigger: "rec:",
          focus: false,
        });
      }
    } else {
      removeMentions({ trigger: "rec:", focus: false });
    }
  };

  const handleChange = (data: Partial<Task>) => {
    onChange(stringifyTask({ ...formModel, ...data }));
  };

  return (
    <Stack>
      <Box sx={{ mb: 2 }}>
        <Editor
          label={t("Description")}
          placeholder={t("Enter text and tags")}
          ariaLabel="Text editor"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(value) => handleChange({ body: value })}
          onEnter={onEnterPress}
          items={items}
        />
      </Box>
      <Grid spacing={2} container>
        {(touchScreen || platform === "ios" || platform === "android") && (
          <Grid item xs={12}>
            <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
              <Button
                sx={{ mr: 1 }}
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => openMentionsMenu({ trigger: "@" })}
              >
                {t("@Context")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => openMentionsMenu({ trigger: "+" })}
              >
                {t("+Project")}
              </Button>
            </Box>
          </Grid>
        )}
        {taskLists.length > 0 && (
          <Grid item xs={12}>
            <FileSelect options={taskLists} onSelect={onFileSelect} />
          </Grid>
        )}
        <Grid
          item
          xs={12}
          sm={showCreationDate && !showCompletionDate ? 12 : 6}
          md={mdGridItems}
        >
          <PrioritySelect
            value={formModel.priority}
            onChange={(priority) => handleChange({ priority })}
          />
        </Grid>
        {showCreationDate && (
          <Grid item xs={12} sm={6} md={mdGridItems}>
            <LocalizationDatePicker
              ariaLabel="Creation date"
              label={t("Creation Date")}
              value={formModel.creationDate}
              onChange={(value) => {
                if (!value || isValid(value)) {
                  handleChange({ creationDate: value ?? undefined });
                }
              }}
            />
          </Grid>
        )}
        {showCompletionDate && (
          <Grid item xs={12} sm={6} md={mdGridItems}>
            <LocalizationDatePicker
              ariaLabel="Completion date"
              label={t("Completion Date")}
              value={formModel.completionDate}
              onChange={(value) => {
                if (!value || isValid(value)) {
                  handleChange({ completionDate: value ?? undefined });
                }
              }}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={mdGridItems}>
          <LocalizationDatePicker
            ariaLabel="Due date"
            label={t("Due Date")}
            value={dueDate}
            onChange={handleDueDateChange}
          />
        </Grid>
        <Grid item xs={12}>
          <RecurrenceSelect value={rec} onChange={handleRecChange} />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default TaskForm;
