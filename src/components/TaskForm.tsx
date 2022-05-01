import { Box, Button, Grid, Stack, useTheme } from "@mui/material";
import { isSameDay, isValid } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TaskList } from "../data/TaskContext";
import { Dictionary } from "../types/common";
import { formatDate, parseDate } from "../utils/date";
import { useKeyboard } from "../utils/keyboard";
import { usePlatform, useTouchScreen } from "../utils/platform";
import { createDueDateRegex, TaskFormData } from "../utils/task";
import {
  contextStyle,
  dueDateStyle,
  projectStyle,
  tagStyle,
} from "../utils/task-styles";
import FileSelect from "./FileSelect";
import LocalizationDatePicker from "./LocalizationDatePicker";
import { MuiMentionTextField, useMentionTextField } from "./MentionTextField";
import PrioritySelect from "./PrioritySelect";

interface TaskFormProps {
  formData: TaskFormData;
  projects: string[];
  contexts: string[];
  tags: Dictionary<string[]>;
  taskLists: TaskList[];
  completed: boolean;
  onChange: (value: TaskFormData) => void;
  onFileSelect: (value?: TaskList) => void;
  onEnterPress: () => void;
}

const TaskForm = (props: TaskFormProps) => {
  const platform = usePlatform();
  const theme = useTheme();
  const rootRef = useRef<HTMLDivElement>();
  const {
    addKeyboardDidShowListener,
    addKeyboardDidHideListener,
    removeAllKeyboardListeners,
  } = useKeyboard();
  const hasTouchScreen = useTouchScreen();
  const {
    formData,
    projects,
    tags: _tags,
    contexts,
    taskLists,
    completed,
    onChange,
    onFileSelect,
    onEnterPress,
  } = props;
  const { t } = useTranslation();
  const tags = useMemo(() => {
    const tags = { ..._tags };
    if (Object.keys(tags).every((k) => k !== "due")) {
      tags.due = [];
    }
    return tags;
  }, [_tags]);
  const showCreationDate = !!formData._id;
  const showCompletionDate = !!formData._id && completed;
  const mdGridItems =
    (showCreationDate || showCompletionDate) &&
    !(showCreationDate && showCompletionDate)
      ? 4
      : 6;
  const { state, openSuggestions, removeMentions, insertMention } =
    useMentionTextField({
      singleLine: true,
      mentions: [
        {
          trigger: "+",
          suggestions: projects,
          style: projectStyle,
        },
        {
          trigger: "@",
          suggestions: contexts,
          style: contextStyle,
        },
        ...Object.entries(tags).map(([key, value]) => ({
          trigger: `${key}:`,
          suggestions: value,
          style: key === "due" ? dueDateStyle : tagStyle,
        })),
      ],
    });

  const handleDueDateChange = (value: Date | null) => {
    if (
      (value && !isValid(value)) ||
      value?.getDate() === formData.dueDate?.getDate()
    ) {
      return;
    }
    if (value) {
      insertMention({
        value: formatDate(value),
        trigger: "due:",
        replace: true,
      });
    } else {
      removeMentions("due:");
    }
  };

  useEffect(() => {
    // set value in due date picker depending on text changes
    const match = formData.body.match(createDueDateRegex());
    if (!match) {
      onChange({ ...formData, dueDate: undefined });
    } else if (match && match.length > 0) {
      const dateString = match[match.length - 1]
        .trim()
        .substring("due:".length);
      const dueDate = parseDate(dateString);
      if (
        dueDate &&
        (!formData.dueDate || !isSameDay(formData.dueDate, dueDate))
      ) {
        onChange({
          ...formData,
          dueDate,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.body]);

  useEffect(() => {
    addKeyboardDidShowListener((info) => {
      rootRef.current?.style.setProperty(
        "padding-bottom",
        info.keyboardHeight + "px"
      );
    });
    addKeyboardDidHideListener(() => {
      rootRef.current?.style.removeProperty("padding-bottom");
    });
    return () => {
      removeAllKeyboardListeners();
    };
  });

  return (
    <Stack ref={rootRef}>
      <Box sx={{ mb: 2 }}>
        <MuiMentionTextField
          state={state}
          label={t("Description")}
          placeholder={t("Enter text and tags")}
          aria-label="Text editor"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          initialValue={formData.body}
          onEnterPress={onEnterPress}
          onChange={(body) => onChange({ ...formData, body: body || "" })}
          autoFocus
          suggestionPopoverZIndex={theme.zIndex.modal + 1}
        />
      </Box>
      <Grid spacing={2} container>
        {(hasTouchScreen || platform === "ios" || platform === "android") && (
          <Grid item xs={12}>
            <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
              <Button
                sx={{ mr: 1 }}
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => openSuggestions("@")}
              >
                {t("@Context")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => openSuggestions("+")}
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
        <Grid item xs={12} sm={6} md={mdGridItems}>
          <PrioritySelect
            value={formData.priority}
            onChange={(priority) => onChange({ ...formData, priority })}
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
                  onChange({ ...formData, creationDate: value ?? undefined });
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
                  onChange({ ...formData, completionDate: value ?? undefined });
                }
              }}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={mdGridItems}>
          <LocalizationDatePicker
            ariaLabel="Due date"
            label={t("Due Date")}
            value={formData.dueDate}
            onChange={handleDueDateChange}
          />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default TaskForm;
