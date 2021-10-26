import { Box, Grid, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/date";
import { TaskFormData } from "../utils/task";
import {
  taskContextStyle,
  taskFieldStyle,
  taskProjectStyle,
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

function getFieldSuggestions(
  fields: Dictionary<string[]>,
  formData: TaskFormData
) {
  const fieldSuggestions = Object.entries(fields).map(([key, value]) => ({
    trigger: `${key}:`,
    suggestions: value,
    styleClass: taskFieldStyle,
  }));

  const dueDate = formData.dueDate;
  const dueFields = fieldSuggestions.find((i) => i.trigger === "due:");

  if (!dueFields && dueDate) {
    fieldSuggestions.push({
      trigger: "due:",
      suggestions: [formatDate(dueDate)],
      styleClass: taskFieldStyle,
    });
  } else if (dueFields && dueDate) {
    dueFields.suggestions = [
      ...dueFields.suggestions,
      formatDate(dueDate),
    ].filter((i, pos, self) => self.indexOf(i) === pos);
  }

  return fieldSuggestions;
}

const TaskForm = (props: TaskDialogForm) => {
  const { formData, projects, fields, contexts, onChange, onEnterPress } =
    props;
  const { t } = useTranslation();
  const [_projects] = useState(projects);
  const [_contexts] = useState(contexts);
  const fieldSuggestions = getFieldSuggestions(fields, formData);
  const [formKey, setFormKey] = useState(0);

  const handleDueDateChange = (value: Date | null) => {
    let newBody: string;
    const bodyWithoutDueDate = formData.body
      .replace(/due:[^/:][^:]*/g, "")
      .trim();
    if (value) {
      const dueDateTag = `due:${formatDate(value)}`;
      newBody = `${bodyWithoutDueDate} ${dueDateTag} `.trimStart();
    } else {
      newBody = bodyWithoutDueDate;
    }
    onChange({ ...formData, body: newBody, dueDate: value ?? undefined });
    setFormKey((key) => key + 1);
  };

  useEffect(() => {
    if (!/due:[^/:][^:]*/g.test(formData.body)) {
      onChange({ ...formData, dueDate: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(formData)]);

  return (
    <Stack>
      <Box sx={{ mb: 2 }}>
        <TaskEditor
          key={formKey}
          label={t("Description")}
          placeholder={t("Enter text and tags")}
          value={formData.body}
          suggestions={[
            {
              trigger: "+",
              suggestions: _projects,
              styleClass: taskProjectStyle,
            },
            {
              trigger: "@",
              suggestions: _contexts,
              styleClass: taskContextStyle,
            },
            ...fieldSuggestions,
          ]}
          onChange={(body) => onChange({ ...formData, body: body || "" })}
          onEnterPress={onEnterPress}
        />
      </Box>
      <Grid spacing={2} container>
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
