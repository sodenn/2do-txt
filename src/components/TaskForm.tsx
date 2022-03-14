import { Box, Button, Grid, Stack } from "@mui/material";
import { isValid } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TaskListState } from "../data/TaskContext";
import { Dictionary } from "../types/common";
import { formatDate, parseDate } from "../utils/date";
import { usePlatform, useTouchScreen } from "../utils/platform";
import { createDueDateRegex, parseTaskBody, TaskFormData } from "../utils/task";
import {
  taskContextStyle,
  taskDudDateStyle,
  taskProjectStyle,
  taskTagStyle,
} from "../utils/task-styles";
import FileSelect from "./FileSelect";
import LocalizationDatePicker from "./LocalizationDatePicker";
import PrioritySelect from "./PrioritySelect";
import TaskEditor from "./TaskEditor/TaskEditor";

interface TaskDialogForm {
  formData: TaskFormData;
  projects: string[];
  contexts: string[];
  tags: Dictionary<string[]>;
  taskLists: TaskListState[];
  onChange: (value: TaskFormData) => void;
  onFileListChange: (value?: TaskListState) => void;
  onEnterPress: () => void;
}

const TaskForm = (props: TaskDialogForm) => {
  const platform = usePlatform();
  const hasTouchScreen = useTouchScreen();
  const {
    formData,
    projects,
    tags,
    contexts,
    taskLists,
    onChange,
    onFileListChange,
    onEnterPress,
  } = props;
  const { t } = useTranslation();
  const [state, setState] = useState({
    key: 0,
    projects,
    contexts,
    tags,
  });

  const rerenderEditor = (body: string) => {
    const { projects, contexts, tags } = parseTaskBody(body);
    setState((state) => ({
      key: state.key + 1,
      projects: [...state.projects, ...projects].filter(
        (item, i, ar) => ar.indexOf(item) === i
      ),
      contexts: [...state.contexts, ...contexts].filter(
        (item, i, ar) => ar.indexOf(item) === i
      ),
      tags: Object.assign(state.tags, tags),
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

    let newBody: string;
    if (value) {
      const dueDateTag = `due:${formatDate(value)}`;
      newBody = `${bodyWithoutDueDate} ${dueDateTag} `.trimStart();
    } else {
      newBody = bodyWithoutDueDate;
    }

    onChange({ ...formData, body: newBody, dueDate: value ?? undefined });
    rerenderEditor(newBody);
  };

  const handleAddTag = (key: string) => {
    const newBody = `${formData.body} ${key}`.trimStart();
    onChange({ ...formData, body: newBody });
    rerenderEditor(newBody);
  };

  useEffect(() => {
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
        <TaskEditor
          key={state.key}
          label={t("Description")}
          placeholder={t("Enter text and tags")}
          value={formData.body}
          suggestions={[
            {
              trigger: "+",
              suggestions: state.projects,
              styleClass: taskProjectStyle,
            },
            {
              trigger: "@",
              suggestions: state.contexts,
              styleClass: taskContextStyle,
            },
            ...Object.entries(state.tags).map(([key, value]) => ({
              trigger: `${key}:`,
              suggestions: value,
              styleClass: key === "due" ? taskDudDateStyle : taskTagStyle,
            })),
          ]}
          onChange={(body) => onChange({ ...formData, body: body || "" })}
          onEnterPress={onEnterPress}
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
                onClick={() => handleAddTag("@")}
              >
                {t("@Context")}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => handleAddTag("+")}
              >
                {t("+Project")}
              </Button>
            </Box>
          </Grid>
        )}
        {taskLists.length > 0 && (
          <Grid item xs={12} sm={6}>
            <FileSelect value={taskLists} onChange={onFileListChange} />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <PrioritySelect
            value={formData.priority}
            onChange={(priority) => onChange({ ...formData, priority })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
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
        {formData._id && (
          <Grid item xs={12} sm={6}>
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
        <Grid item xs={12} sm={6}>
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
