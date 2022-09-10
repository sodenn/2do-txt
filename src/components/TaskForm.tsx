import { Box, Button, Grid, Stack } from "@mui/material";
import { createMentionsPlugin, useMentions } from "@react-fluent-edit/mentions";
import { MuiFluentEdit, MuiMentionCombobox } from "@react-fluent-edit/mui";
import { isValid } from "date-fns";
import { KeyboardEvent, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/date";
import { useKeyboard } from "../utils/keyboard";
import { usePlatform, useTouchScreen } from "../utils/platform";
import {
  getDueDateValue,
  getRecValue,
  getTaskTagStyle,
  TaskFormData,
} from "../utils/task";
import { TaskList } from "../utils/task-list";
import { contextStyle, projectStyle } from "../utils/task-styles";
import FileSelect from "./FileSelect";
import LocalizationDatePicker from "./LocalizationDatePicker";
import PrioritySelect from "./PrioritySelect";
import RecurrenceSelect from "./RecurrenceSelect";

interface TaskFormProps {
  formData: TaskFormData;
  projects: string[];
  contexts: string[];
  tags: Record<string, string[]>;
  taskLists: TaskList[];
  completed: boolean;
  onChange: (value: TaskFormData) => void;
  onFileSelect: (value?: TaskList) => void;
  onEnterPress: () => void;
}

const TaskForm = (props: TaskFormProps) => {
  const platform = usePlatform();
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
  const rec = getRecValue(formData.body);
  const dueDate = getDueDateValue(formData.body);
  const showCreationDate = !!formData._id;
  const showCompletionDate = !!formData._id && completed;
  const mdGridItems =
    (showCreationDate || showCompletionDate) &&
    !(showCreationDate && showCompletionDate)
      ? 4
      : 6;
  const { openMentionsCombobox, removeMentions, addMention } = useMentions();
  const plugins = useMemo(
    () => [
      createMentionsPlugin({
        mentions: [
          {
            trigger: "+",
            style: projectStyle,
          },
          {
            trigger: "@",
            style: contextStyle,
          },
          ...Object.keys(tags).map((key) => ({
            trigger: `${key}:`,
            style: getTaskTagStyle(key),
          })),
        ],
      }),
    ],
    [tags]
  );

  const handleDueDateChange = (value: Date | null) => {
    if ((value && !isValid(value)) || value?.getDate() === dueDate?.getDate()) {
      return;
    }
    if (value) {
      removeMentions({ trigger: "due:" });
      addMention({
        text: formatDate(value),
        trigger: "due:",
      });
    } else {
      removeMentions({ trigger: "due:" });
    }
  };

  const handleRecChange = (value: string | null) => {
    if (value) {
      addMention({
        text: value,
        trigger: "rec:",
      });
    } else {
      removeMentions({ trigger: "rec:" });
    }
  };

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

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      onEnterPress();
    }
  };

  return (
    <Stack ref={rootRef}>
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
          onChange={(body) => onChange({ ...formData, body: body || "" })}
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
        {(hasTouchScreen || platform === "ios" || platform === "android") && (
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
