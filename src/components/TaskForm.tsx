import { Box, Button, Grid, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate, parseDate } from "../utils/date";
import { usePlatform, useTouchScreen } from "../utils/platform";
import { parseTaskBody, TaskFormData } from "../utils/task";
import {
  taskContextStyle,
  taskFieldStyle,
  taskProjectStyle
} from "../utils/task-styles";
import { Dictionary } from "../utils/types";
import LocalizationDatePicker from "./LocalizationDatePicker";
import PrioritySelect from "./PrioritySelect";
import TaskEditor from "./TaskEditor/TaskEditor";

interface TaskDialogForm {
  formData: TaskFormData;
  projects: string[];
  contexts: string[];
  fields: Dictionary<string[]>;
  onChange: (value: TaskFormData) => void;
  onEnterPress: () => void;
}

const TaskForm = (props: TaskDialogForm) => {
  const platform = usePlatform();
  const hasTouchScreen = useTouchScreen();
  const { formData, projects, fields, contexts, onChange, onEnterPress } =
    props;
  const { t } = useTranslation();
  const [state, setState] = useState({
    key: 0,
    projects,
    contexts,
    fields,
  });

  const rerenderEditor = (body: string) => {
    const { projects, contexts, fields } = parseTaskBody(body);
    setState((state) => ({
      key: state.key + 1,
      projects: [...state.projects, ...projects].filter(
        (item, i, ar) => ar.indexOf(item) === i
      ),
      contexts: [...state.contexts, ...contexts].filter(
        (item, i, ar) => ar.indexOf(item) === i
      ),
      fields: Object.assign(state.fields, fields),
    }));
  };

  const handleDueDateChange = (value: Date | null) => {
    let newBody: string;
    const bodyWithoutDueDate = formData.body
      .replace(/due:[\S]+\s?/g, "")
      .trim();
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
    const match = formData.body.match(/due:[\S]+\s?/g);
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
            ...Object.entries(state.fields).map(([key, value]) => ({
              trigger: `${key}:`,
              suggestions: value,
              styleClass: taskFieldStyle,
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
        <Grid item xs={12} sm={6}>
          <PrioritySelect
            value={formData.priority}
            onChange={(priority) => onChange({ ...formData, priority })}
          />
        </Grid>
        {(formData.creationDate || formData._id) && (
          <Grid item xs={12} sm={6}>
            <LocalizationDatePicker
              label={t("Creation Date")}
              value={formData.creationDate}
              onChange={(value) =>
                onChange({ ...formData, creationDate: value ?? undefined })
              }
            />
          </Grid>
        )}
        {(formData.completionDate || formData._id) && (
          <Grid item xs={12} sm={6}>
            <LocalizationDatePicker
              label={t("Completion Date")}
              value={formData.completionDate}
              onChange={(value) =>
                onChange({ ...formData, completionDate: value ?? undefined })
              }
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
