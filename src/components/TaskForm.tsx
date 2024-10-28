import { Editor, EditorContext } from "@/components/Editor";
import { FileSelect } from "@/components/FileSelect";
import { PriorityPicker } from "@/components/PriorityPicker";
import { RecurrencePicker } from "@/components/RecurrencePicker";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useSettingsStore } from "@/stores/settings-store";
import { formatDate, isDateEqual } from "@/utils/date";
import { HAS_TOUCHSCREEN } from "@/utils/platform";
import {
  getDueDateValue,
  getRecValue,
  parseTask,
  stringifyTask,
  Task,
} from "@/utils/task";
import { TaskList } from "@/utils/task-list";
import { cn } from "@/utils/tw-utils";
import { isValid } from "date-fns";
import { useBeautifulMentions } from "lexical-beautiful-mentions";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface TaskFormProps {
  value?: string;
  taskLists: TaskList[];
  projects: string[];
  contexts: string[];
  tags: Record<string, string[]>;
  onChange: (value: string, emptyBody: boolean) => void;
  onFileSelect: (value?: TaskList) => void;
  onEnterPress: () => void;
}

interface TaskGridProps
  extends Omit<TaskFormProps, "value" | "projects" | "contexts" | "tags"> {
  items: Record<string, string[]>;
  formModel: Task;
}

export function TaskForm(props: TaskFormProps) {
  const { value = "", projects, contexts, tags, ...other } = props;

  const _tags = useMemo(() => {
    const tags = Object.keys(props.tags).reduce<Record<string, string[]>>(
      (acc, key) => {
        acc[key + ":"] = props.tags[key];
        return acc;
      },
      {},
    );
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
    [contexts, projects, _tags],
  );

  const triggers = useMemo(() => Object.keys(items), [items]);

  const formModel = useMemo(() => parseTask(value), [value]);

  return (
    <EditorContext initialValue={formModel.body} triggers={triggers}>
      <TaskGrid {...other} items={items} formModel={formModel} />
    </EditorContext>
  );
}

function TaskGrid(props: TaskGridProps) {
  const language = useSettingsStore((state) => state.language);
  const { formModel, items, taskLists, onChange, onFileSelect, onEnterPress } =
    props;
  const { t } = useTranslation();
  const rec = getRecValue(formModel.body);
  const dueDate = getDueDateValue(formModel.body);
  const showTaskList = taskLists.length > 1;
  const {
    openMentionMenu,
    removeMentions,
    insertMention,
    renameMentions,
    hasMentions,
  } = useBeautifulMentions();

  const handleDueDateChange = (value?: Date) => {
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
    const task = { ...formModel, ...data };
    const value = stringifyTask(task);
    onChange(value, !!task.body);
  };

  return (
    <div className={cn("flex flex-col")}>
      <Editor
        placeholder={t("Enter text and tags")}
        ariaLabel="Text editor"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        onChange={(value) => handleChange({ body: value })}
        onEnter={onEnterPress}
        items={items}
      >
        <PriorityPicker
          value={formModel.priority}
          onChange={(priority) => handleChange({ priority })}
        />
        <DatePicker
          ariaLabel="Due date"
          tooltip={t("Due Date")}
          value={dueDate}
          onChange={handleDueDateChange}
          locale={language}
        />
        <RecurrencePicker value={rec} onChange={handleRecChange} />
      </Editor>
      {HAS_TOUCHSCREEN && (
        <div className="mb-1 flex gap-1">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => openMentionMenu({ trigger: "@" })}
          >
            {t("@Context")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => openMentionMenu({ trigger: "+" })}
          >
            {t("+Project")}
          </Button>
        </div>
      )}
      {showTaskList && (
        <div className="my-1">
          <FileSelect options={taskLists} onSelect={onFileSelect} />
        </div>
      )}
    </div>
  );
}
