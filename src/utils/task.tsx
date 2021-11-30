import clsx from "clsx";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { formatDate, formatLocaleDate, parseDate } from "./date";
import {
  taskChipStyle,
  taskCompletedStyle,
  taskContextStyle,
  taskDisabledStyle,
  taskDudDateStyle,
  taskPriorityStyle,
  taskProjectStyle,
  taskTagStyle,
} from "./task-styles";
import { Dictionary } from "./types";
import { generateId } from "./uuid";

export type Priority = "A" | "B" | "C" | "D" | string;

export interface Task {
  completed: boolean;
  projects: string[];
  contexts: string[];
  completionDate?: Date;
  creationDate?: Date;
  priority?: Priority;
  tags: Dictionary<string[]>;
  dueDate?: Date;
  body: string;
  raw: string;
  _id: string;
  _order: number;
}

export interface TaskFormData {
  body: string;
  priority?: string;
  dueDate?: Date;
  creationDate?: Date;
  completionDate?: Date;
  _id?: string;
}

export const createDueDateRegex = () =>
  /due:\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])\s?/g;

export function parseTask(text: string, order: number) {
  const line = text.trim();
  const tokens = line.split(/\s+/).map((s) => s.trim());

  const _id = generateId();

  let completed = false;
  if (tokens[0] === "x") {
    completed = true;
    tokens.shift();
  }

  let priority: string | null = null;
  let priorityMatches = tokens[0].match(/\(([A-Z])\)/);
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

  let creationDate = parseDate(tokens[0]);
  if (creationDate) {
    tokens.shift();
  }

  const body = tokens.join(" ");

  const task: Task = {
    completed,
    body,
    raw: line,
    _id,
    _order: order,
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

export function parseTaskBody(
  body: string
): Pick<Task, "contexts" | "projects" | "tags" | "dueDate"> {
  const tokens = body
    .trim()
    .split(/\s+/)
    .map((t) => t.trim());

  const contexts = spliceWhere(tokens, (s) => /^@[\S]+/.test(s))
    .map((t) => t.substr(1))
    .filter((t) => t.length > 0);

  const projects = spliceWhere(tokens, (s) => /^\+[\S]+/.test(s))
    .map((t) => t.substr(1))
    .filter((t) => t.length > 0);

  const tags: Dictionary<string[]> = {};
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
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const { sortBy } = useFilter();
  return (task: Task) => {
    const tokens = task.body
      .trim()
      .split(/\s+/)
      .map((t) => t.trim());

    let formattedTokens = tokens.map((token, index) => {
      if (/^@[\S]+/.test(token)) {
        return (
          <span key={index} className={clsx(taskContextStyle, taskChipStyle)}>
            {token}
          </span>
        );
      } else if (/^\+[\S]+/.test(token)) {
        return (
          <span key={index} className={clsx(taskProjectStyle, taskChipStyle)}>
            {token}
          </span>
        );
      } else if (/[^:]+:[^/:][^:]*/.test(token)) {
        const substrings = token.split(":");
        const key = substrings[0].toLowerCase();
        const translatedKey = t(key);
        const keySuffix = translatedKey !== key ? ": " : ":";
        const value = substrings[1];
        const date = parseDate(value);
        const displayKey = translatedKey + keySuffix;
        const displayValue = date ? formatLocaleDate(date, language) : value;
        const text = displayKey + displayValue;
        return (
          <span
            key={index}
            className={clsx(
              {
                [taskDudDateStyle]: key === "due",
                [taskTagStyle]: key !== "due",
              },
              taskChipStyle
            )}
          >
            {text}
          </span>
        );
      } else {
        return <Fragment key={index}>{token}</Fragment>;
      }
    });

    if (task.priority && sortBy !== "priority") {
      const priorityElement = (
        <span key={task._id} className={clsx(taskChipStyle, taskPriorityStyle)}>
          {task.priority}
        </span>
      );
      formattedTokens = [priorityElement, ...formattedTokens];
    }

    const completedClass = task.completed
      ? clsx(taskCompletedStyle, taskDisabledStyle)
      : undefined;

    return (
      <span className={completedClass}>
        {formattedTokens
          .map<React.ReactNode>((e) => e)
          .reduce((prev, curr) => [prev, " ", curr])}
      </span>
    );
  };
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
