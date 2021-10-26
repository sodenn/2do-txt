import { parseDate } from "./date";
import { parseTask, stringifyTask, Task } from "./task";
import { Dictionary } from "./types";

interface TaskListParseResult {
  taskList: Task[];
  lineEnding: string;
  projects: Dictionary<number>;
  contexts: Dictionary<number>;
  fields: Dictionary<string[]>;
  priorities: Dictionary<number>;
}

export function parseTaskList(text?: string): TaskListParseResult {
  if (text) {
    const lineEnding = /\r\n/.test(text) ? "\r\n" : "\n";
    const taskList = text
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t, o) => parseTask(t, o));
    const priorities = (
      taskList
        .map((task) => task.priority)
        .filter((priority) => !!priority) as string[]
    ).reduce<Dictionary<number>>((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});
    const projects = taskList
      .flatMap((i) => i.projects)
      .reduce<Dictionary<number>>((prev, cur) => {
        prev[cur] = (prev[cur] || 0) + 1;
        return prev;
      }, {});
    const contexts = taskList
      .flatMap((i) => i.contexts)
      .reduce<Dictionary<number>>((prev, cur) => {
        prev[cur] = (prev[cur] || 0) + 1;
        return prev;
      }, {});
    let fields: Dictionary<string[]> = {};
    taskList.forEach((i) => {
      Object.entries(i.fields).forEach(([key, value]) => {
        if (fields[key]) {
          fields[key] = [...fields[key], ...value];
        } else {
          fields[key] = value;
        }
      });
    });
    return {
      taskList,
      lineEnding,
      priorities,
      projects,
      contexts,
      fields,
    };
  } else {
    return {
      taskList: [],
      lineEnding: "\n",
      priorities: {},
      projects: {},
      contexts: {},
      fields: {},
    };
  }
}

export function stringifyTaskList(taskList: Task[], lineEnding: string) {
  return [...taskList]
    .sort((t1, t2) => t1._order - t2._order)
    .map((t) => stringifyTask(t))
    .join(lineEnding);
}

export function sortByPriority(a: Task, b: Task) {
  if (a.priority && !b.priority) {
    return -1;
  } else if (!a.priority && b.priority) {
    return 1;
  } else if (!a.priority && !b.priority) {
    return 0;
  } else if (a.priority && b.priority && a.priority > b.priority) {
    return 1;
  } else if (a.priority && b.priority && a.priority < b.priority) {
    return -1;
  } else {
    return 0;
  }
}

export function sortByDueDate(a: Task, b: Task) {
  const dueDateA =
    a.fields["due"]?.length > 0 ? parseDate(a.fields["due"][0]) : undefined;
  const dueDateB =
    b.fields["due"]?.length > 0 ? parseDate(b.fields["due"][0]) : undefined;
  if (dueDateA && !dueDateB) {
    return -1;
  } else if (!dueDateA && dueDateB) {
    return 1;
  } else if (!dueDateA && !dueDateB) {
    return 0;
  } else if (dueDateA && dueDateB && dueDateA.getTime() > dueDateB.getTime()) {
    return 1;
  } else if (dueDateA && dueDateB && dueDateA.getTime() < dueDateB.getTime()) {
    return -1;
  } else {
    return 0;
  }
}

export function sortByOriginalOrder(a: Task, b: Task) {
  if (a._order < b._order) {
    return -1;
  } else if (a._order > b._order) {
    return 1;
  } else {
    return 0;
  }
}
