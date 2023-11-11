import { PriorityBox } from "@/components/PriorityBox";
import { TagBox } from "@/components/TagBox";
import { useFilterStore } from "@/stores/filter-store";
import {
  PriorityTransformation,
  useSettingsStore,
} from "@/stores/settings-store";
import {
  formatDate,
  formatLocaleDate,
  parseDate,
  todayDate,
} from "@/utils/date";
import { generateId } from "@/utils/uuid";
import { Typography } from "@mui/joy";
import {
  addBusinessDays,
  addDays,
  addMonths,
  addWeeks,
  addYears,
} from "date-fns";
import { Fragment, ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Priority = "A" | "B" | "C" | "D" | string;

export interface Task {
  readonly projects: string[];
  readonly contexts: string[];
  readonly tags: Record<string, string[]>;
  readonly dueDate?: Date;
  readonly id: string;
  readonly raw: string;
  completed: boolean;
  completionDate?: Date;
  creationDate?: Date;
  priority?: Priority;
  body: string;
  order: number;
}

export const createDueDateRegex = () =>
  /\bdue:\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\s?/g;

const createDueDateValueRegex = () =>
  /\b\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])(\s|$)/g;

const createRecRegex = () => /\brec:(\+?)([1-9][0-9]*)([dbwmy])(\s|$)/g;

const createRecValueRegex = () => /\b(\+?)([1-9][0-9]*)([dbwmy])(\s|$)/g;

export function getDueDateValue(text: string) {
  const match = text.matchAll(createDueDateValueRegex());
  const lastMatch = Array.from(match).pop();
  if (lastMatch) {
    return parseDate(lastMatch[0]);
  }
}

function getRecMatch(text?: string) {
  if (!text) {
    return;
  }
  const match = text.matchAll(createRecRegex());
  return Array.from(match).pop();
}

export function getRecValueMatch(text?: string) {
  if (!text) {
    return;
  }
  const match = text.matchAll(createRecValueRegex());
  return Array.from(match).pop();
}

export function getRecValue(text: string) {
  const match = getRecValueMatch(text);
  if (match) {
    return match[0];
  }
}

export function parseTask(text: string) {
  const line = text.trim();
  const tokens = line.split(/\s+/).map((s) => s.trim());

  const id = generateId();

  let completed = false;
  if (tokens[0] === "x") {
    completed = true;
    tokens.shift();
  }

  let priority: string | null = null;
  const priorityMatches = tokens[0].match(/\(([A-Z])\)/);
  if (priorityMatches) {
    priority = priorityMatches[1];
    tokens.shift();
  }

  let completionDate: Date | undefined = undefined;
  if (completed && tokens.length > 1) {
    completionDate = parseDate(tokens[0]);
    if (completionDate) {
      tokens.shift();
    }
  }

  const creationDate = parseDate(tokens[0]);
  if (creationDate) {
    tokens.shift();
  }

  const body = tokens.join(" ");

  const task: Task = {
    completed,
    body,
    raw: line,
    id,
    order: -1,
    ...parseTaskBody(body),
  };

  if (completionDate) {
    task.completionDate = completionDate;
  }
  if (priority) {
    task.priority = priority;
  }
  if (creationDate) {
    task.creationDate = creationDate;
  }

  return task;
}

function parseTaskBody(
  body: string,
): Pick<Task, "contexts" | "projects" | "tags" | "dueDate"> {
  const tokens = body
    .trim()
    .split(/\s+/)
    .map((t) => t.trim());

  const contexts = spliceWhere(tokens, (s) => /^@[\S]+/.test(s))
    .map((t) => t.substring(1))
    .filter((t) => t.length > 0);

  const projects = spliceWhere(tokens, (s) => /^\+[\S]+/.test(s))
    .map((t) => t.substring(1))
    .filter((t) => t.length > 0);

  const tags: Record<string, string[]> = {};
  spliceWhere(tokens, (s) => /[^:]+:[^/:][^:]*/.test(s)).forEach((s) => {
    const tuple = s.split(":");
    if (tags[tuple[0]]) {
      tags[tuple[0]] = [...tags[tuple[0]], tuple[1]];
    } else {
      tags[tuple[0]] = [tuple[1]];
    }
  });

  const dueDate =
    tags["due"]?.length > 0
      ? parseDate(tags["due"][tags["due"].length - 1])
      : undefined;

  return {
    contexts,
    projects,
    tags,
    dueDate,
  };
}

export function useFormatBody() {
  const taskView = useSettingsStore((state) => state.taskView);
  const outlined = taskView === "list";
  const dueDate = taskView === "list";
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const sortBy = useFilterStore((state) => state.sortBy);
  return (task: Task) => {
    const subStrings = task.body
      .trim()
      .split(/\s+/)
      .map((t) => t.trim());

    const elements: ReactNode[] = subStrings
      .map((token, index) => {
        if (/^@\S+/.test(token)) {
          return (
            <TagBox
              outlined={outlined}
              completed={task.completed}
              type="context"
              key={index}
            >
              {token}
            </TagBox>
          );
        } else if (/^\+\S+/.test(token)) {
          return (
            <TagBox
              outlined={outlined}
              completed={task.completed}
              type="project"
              key={index}
            >
              {token}
            </TagBox>
          );
        } else if (/[^:]+:[^/:][^:]*/.test(token)) {
          const substrings = token.split(":");
          const key = substrings[0].toLowerCase();
          if (key === "due" && !dueDate) {
            return undefined;
          }
          const translatedKey = t(key);
          const keySuffix = translatedKey !== key ? ": " : ":";
          const value = substrings[1];
          const date = parseDate(value);
          const displayKey = translatedKey + keySuffix;
          const displayValue = date ? formatLocaleDate(date, language) : value;
          const text = displayKey + displayValue;
          return (
            <TagBox
              key={index}
              outlined={outlined}
              completed={task.completed}
              type="tag"
              tagKey={key}
            >
              {text}
            </TagBox>
          );
        } else {
          return <Fragment key={index}>{token}</Fragment>;
        }
      })
      .filter((e) => !!e);

    if (task.priority && sortBy !== "priority") {
      const priorityElement = (
        <PriorityBox
          outlined={outlined}
          completed={task.completed}
          key={task.id}
        >
          {task.priority}
        </PriorityBox>
      );
      elements.unshift(priorityElement);
    }

    return (
      <Typography
        component="span"
        variant="plain"
        color={task.completed ? "completed" : undefined}
        sx={{
          ...(task.completed && {
            textDecoration: "line-through",
          }),
          fontSize: "inherit",
        }}
      >
        {elements.reduce((prev, curr) => [prev, " ", curr])}
      </Typography>
    );
  };
}

export function createNextRecurringTask(
  task: Task,
  createCreationDate: boolean,
) {
  const recMatch = getRecMatch(task.body);

  if (!recMatch || recMatch.length < 4) {
    return;
  }

  const strict = recMatch[1] === "+";
  const number = parseInt(recMatch[2]);
  const unit = recMatch[3];

  const dueDateRegex = createDueDateRegex();
  const dueDateMatch = task.body.match(dueDateRegex);

  const oldCompletionDate = task.completionDate
    ? task.completionDate
    : todayDate();

  const oldDueDateString = dueDateMatch
    ? dueDateMatch[dueDateMatch.length - 1].trim().substring("due:".length)
    : undefined;
  const oldDueDate = oldDueDateString
    ? parseDate(oldDueDateString) || todayDate()
    : todayDate();

  const newDueDate = addToDate(
    strict ? oldDueDate : oldCompletionDate,
    number,
    unit,
  );

  const recurringTask = { ...task };

  if (createCreationDate) {
    recurringTask.creationDate = oldCompletionDate;
  } else {
    delete recurringTask.creationDate;
  }

  const newDueDateString = formatDate(newDueDate);
  recurringTask.body = dueDateMatch
    ? recurringTask.body.replace(
        dueDateMatch[0].trim(),
        `due:${newDueDateString}`,
      )
    : `${recurringTask.body} due:${newDueDateString}`;

  const raw = stringifyTask(recurringTask);

  return { ...parseTask(raw), order: task.order };
}

function addToDate(date: Date, amount: number, unit: string) {
  if (unit === "d") {
    return addDays(date, amount);
  } else if (unit === "b") {
    return addBusinessDays(date, amount);
  } else if (unit === "w") {
    return addWeeks(date, amount);
  } else if (unit === "m") {
    return addMonths(date, amount);
  } else if (unit === "y") {
    return addYears(date, amount);
  } else {
    throw new Error(`Unknown unit "${unit}"`);
  }
}

export function transformPriority(
  task: Task,
  transformation: PriorityTransformation,
) {
  const updatedTask = { ...task };
  if (updatedTask.completed) {
    if (transformation === "remove") {
      delete updatedTask.priority;
    } else if (transformation === "archive" && updatedTask.priority) {
      updatedTask.body = removePriTag(updatedTask.body);
      updatedTask.body += ` pri:${updatedTask.priority}`;
      updatedTask.tags["pri"] = [updatedTask.priority];
      delete updatedTask.priority;
    }
  } else if (transformation === "archive") {
    const priRegex = getPriRegex();
    const match = updatedTask.body.match(priRegex);
    if (match && match.length > 0) {
      updatedTask.priority = match[0].trim().slice(-1);
      updatedTask.body = removePriTag(updatedTask.body);
    }
  }
  return { ...updatedTask, raw: stringifyTask(updatedTask) };
}

function removePriTag(text: string) {
  const priRegex = getPriRegex();
  const match = text.match(priRegex);
  if (match && match.length > 0) {
    if (match[0].startsWith(" ") && match[0].endsWith(" ")) {
      return text.replace(priRegex, " ").trim();
    } else {
      return text.replace(priRegex, "").trim();
    }
  } else {
    return text;
  }
}

function getPriRegex() {
  return /(^|\s)pri:[A-Z]($|\s)/g;
}

export function stringifyTask(task: Task) {
  const tokens = [];
  if (task.completed) {
    tokens.push("x");
  }
  if (task.priority) {
    tokens.push(`(${task.priority})`);
  }
  if (task.completionDate) {
    tokens.push(formatDate(task.completionDate));
  }
  if (task.creationDate) {
    tokens.push(formatDate(task.creationDate));
  }
  tokens.push(task.body);
  return tokens.join(" ");
}

function spliceWhere<T>(items: T[], predicate: (s: T) => boolean): T[] {
  const result: T[] = [];
  for (let index = 0; index < items.length; index++) {
    if (predicate(items[index])) {
      result.push(items[index]);
      items.splice(index, 1);
      index--;
    }
  }
  return result;
}
