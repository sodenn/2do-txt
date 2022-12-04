import { Box, Button, Grid, Stack, Theme, useTheme } from "@mui/material";
import { createMentionsPlugin, useMentions } from "@react-fluent-edit/mentions";
import { MuiFluentEdit, MuiMentionCombobox } from "@react-fluent-edit/mui";
import { isValid } from "date-fns";
import { CSSProperties, KeyboardEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatDate, isDateEqual } from "../utils/date";
import { getPlatform, hasTouchScreen } from "../utils/platform";
import {
  getDueDateValue,
  getRecValue,
  parseTask,
  stringifyTask,
  Task,
} from "../utils/task";
import { TaskList } from "../utils/task-list";
import FileSelect from "./FileSelect";
import LocalizationDatePicker from "./LocalizationDatePicker";
import PrioritySelect from "./PrioritySelect";
import RecurrenceSelect from "./RecurrenceSelect";

interface TaskFormProps {
  raw: string;
  newTask: boolean;
  taskLists: TaskList[];
  projects: string[];
  contexts: string[];
  tags: Record<string, string[]>;
  onChange: (raw: string) => void;
  onFileSelect: (value?: TaskList) => void;
  onEnterPress: () => void;
}

export function getTagStyle(key: string, theme: Theme): CSSProperties {
  return key === "due"
    ? {
        color: theme.palette.warning.contrastText,
        backgroundColor: theme.palette.warning.light,
        whiteSpace: "nowrap",
      }
    : key === "pri"
    ? {
        color: theme.palette.secondary.contrastText,
        backgroundColor: theme.palette.secondary.light,
        whiteSpace: "nowrap",
      }
    : {
        color:
          theme.palette.mode === "dark"
            ? theme.palette.grey["900"]
            : theme.palette.grey["100"],
        backgroundColor:
          theme.palette.mode === "dark"
            ? theme.palette.grey["400"]
            : theme.palette.grey["600"],
        whiteSpace: "nowrap",
      };
}

const TaskForm = (props: TaskFormProps) => {
  const platform = getPlatform();
  const theme = useTheme();
  const touchScreen = hasTouchScreen();
  const {
    raw,
    newTask: isNewTask,
    projects,
    tags: _tags,
    contexts,
    taskLists,
    onChange,
    onFileSelect,
    onEnterPress,
  } = props;
  const formData = { ...parseTask(raw) };
  const { t } = useTranslation();
  const tags = useMemo(() => {
    const tags = { ..._tags };
    if (Object.keys(tags).every((k) => k !== "due")) {
      tags.due = [];
    }
    return tags;
  }, [_tags]);
  const rec = getRecValue(formData.body);
  const dueDate = getDueDateValue(formData.body);
  const showCreationDate = isNewTask;
  const showCompletionDate = isNewTask && formData.completed;
  const mdGridItems =
    (showCreationDate || showCompletionDate) &&
    !(showCreationDate && showCompletionDate)
      ? 4
      : 6;
  const { openMentionsCombobox, removeMentions, renameMentions } =
    useMentions();
  const plugins = useMemo(
    () => [
      createMentionsPlugin({
        mentions: [
          {
            trigger: "+",
            style: {
              color: theme.palette.info.contrastText,
              backgroundColor: theme.palette.info.light,
            },
          },
          {
            trigger: "@",
            style: {
              color: theme.palette.success.contrastText,
              backgroundColor: theme.palette.success.light,
            },
          },
          ...Object.keys(tags).map((key) => ({
            trigger: `${key}:`,
            style: getTagStyle(key, theme),
          })),
        ],
      }),
    ],
    [tags, theme]
  );

  const handleDueDateChange = (value: Date | null) => {
    if ((value && !isValid(value)) || isDateEqual(value, dueDate)) {
      return;
    }
    if (value) {
      renameMentions({
        newText: formatDate(value),
        trigger: "due:",
      });
    } else {
      removeMentions({ trigger: "due:" });
    }
  };

  const handleRecChange = (value: string | null) => {
    if (value) {
      renameMentions({
        newText: value,
        trigger: "rec:",
      });
    } else {
      removeMentions({ trigger: "rec:" });
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      onEnterPress();
    }
  };

  const handleChange = (data: Partial<Task>) => {
    onChange(stringifyTask({ ...formData, ...data }));
  };

  return (
    <Stack>
      <Box sx={{ mb: 2 }}>
        <MuiFluentEdit
          label={t("Description")}
          placeholder={t("Enter text and tags")}
          aria-label="Text editor"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          initialValue={formData.body}
          onKeyDown={handleKeyDown}
          onChange={(body) => handleChange({ body })}
          autoFocus
          singleLine
          plugins={plugins}
        >
          <MuiMentionCombobox
            renderAddMentionLabel={(value) => t("Add tag", { name: value })}
            items={[
              ...projects.map((i) => ({ text: i, trigger: "+" })),
              ...contexts.map((i) => ({ text: i, trigger: "@" })),
              ...Object.entries(tags).flatMap(([trigger, items]) =>
                items.map((i) => ({ text: i, trigger: trigger }))
              ),
            ]}
          />
        </MuiFluentEdit>
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
                onClick={() => openMentionsCombobox("@")}
              >
                {t("@Context")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => openMentionsCombobox("+")}
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
            value={formData.priority}
            onChange={(priority) => handleChange({ priority })}
          />
        </Grid>
        {showCreationDate && (
          <Grid item xs={12} sm={6} md={mdGridItems}>
            <LocalizationDatePicker
              ariaLabel="Creation date"
              label={t("Creation Date")}
              value={formData.creationDate}
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
              value={formData.completionDate}
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
