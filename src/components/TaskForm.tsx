import { Box, Button, Grid, Stack } from "@mui/material";
import { isValid } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TaskList } from "../data/TaskContext";
import { Dictionary } from "../types/common";
import { formatDate, parseDate } from "../utils/date";
import { usePlatform, useTouchScreen } from "../utils/platform";
import { createDueDateRegex, parseTaskBody, TaskFormData } from "../utils/task";
import {
  contextStyle,
  dueDateStyle,
  projectStyle,
  tagStyle,
} from "../utils/task-styles";
import FileSelect from "./FileSelect";
import LocalizationDatePicker from "./LocalizationDatePicker";
import MentionTextbox from "./MentionTextbox";
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
  const hasTouchScreen = useTouchScreen();
  const {
    formData,
    projects,
    tags,
    contexts,
    taskLists,
    completed,
    onChange,
    onFileSelect,
    onEnterPress,
  } = props;
  const { t } = useTranslation();
  const showCreationDate = !!formData._id;
  const showCompletionDate = !!formData._id && completed;
  const mdGridItems =
    (showCreationDate || showCompletionDate) &&
    !(showCreationDate && showCompletionDate)
      ? 4
      : 6;
  const [state, setState] = useState({
    key: 0,
    autoFocus: true,
    projects,
    contexts,
    tags,
  });

  const setTaskFormState = (body: string, autoFocus = true) => {
    const result = parseTaskBody(body);
    setState((state) => ({
      autoFocus,
      key: state.key + 1,
      projects: [...projects, ...result.projects].filter(
        (item, i, ar) => ar.indexOf(item) === i
      ),
      contexts: [...contexts, ...result.contexts].filter(
        (item, i, ar) => ar.indexOf(item) === i
      ),
      tags: Object.assign(tags, result.tags),
    }));
  };

  const handleDueDateChange = (value: Date | null) => {
    if (
      (value && !isValid(value)) ||
      value?.getDate() === formData.dueDate?.getDate()
    ) {
      return;
    }

    const bodyWithoutDueDate = formData.body
      .replace(createDueDateRegex(), "")
      .trim();

    let body: string;
    if (value) {
      const dueDateTag = `due:${formatDate(value)}`;
      body = `${bodyWithoutDueDate} ${dueDateTag}`.trimStart();
    } else {
      body = bodyWithoutDueDate;
    }

    onChange({ ...formData, body, dueDate: value ?? undefined });
    setTaskFormState(body, false);
  };

  const handleOpenMentionSuggestions = (trigger: string) => {
    const body = `${formData.body.trimEnd()} ${trigger}`.trimStart();
    onChange({ ...formData, body });
    setTaskFormState(body);
  };

  useEffect(() => {
    // set value in due date picker depending on text changes
    const match = formData.body.match(createDueDateRegex());
    if (formData.dueDate && !match) {
      onChange({ ...formData, dueDate: undefined });
    } else if (!formData.dueDate && match && match.length > 0) {
      const dateString = match[match.length - 1].trim().substr("due:".length);
      const dueDate = parseDate(dateString);
      if (dueDate) {
        onChange({
          ...formData,
          dueDate,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.body, formData.dueDate]);

  return (
    <Stack>
      <Box sx={{ mb: 2 }}>
        <MentionTextbox
          key={state.key}
          label={t("Description")}
          placeholder={t("Enter text and tags")}
          initialValue={formData.body}
          onEnterPress={onEnterPress}
          onChange={(body) => onChange({ ...formData, body: body || "" })}
          autoFocus={state.autoFocus}
          triggers={[
            { value: "+", style: contextStyle },
            { value: "@", style: projectStyle },
            ...Object.entries(state.tags).map(([key, value]) => ({
              value: `${key}:`,
              style: key === "due" ? dueDateStyle : tagStyle,
            })),
          ]}
          suggestions={[
            {
              trigger: "+",
              items: state.projects,
            },
            {
              trigger: "@",
              items: state.contexts,
            },
            ...Object.entries(state.tags).map(([key, value]) => ({
              trigger: `${key}:`,
              items: value,
            })),
          ]}
        />
      </Box>
      <Grid spacing={2} container>
        {(hasTouchScreen || platform === "ios" || platform === "android") && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
              <Button
                sx={{ mr: 1 }}
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => handleOpenMentionSuggestions("@")}
              >
                {t("@Context")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => handleOpenMentionSuggestions("+")}
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
