import { isAfter, isBefore } from "date-fns";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SortKey, useAppContext } from "../data/AppContext";
import { groupBy } from "./array";
import { formatDate, formatLocaleDate, parseDate } from "./date";
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

interface TaskListFilter {
  searchTerm: string;
  selectedPriorities: string[];
  selectedProjects: string[];
  selectedContexts: string[];
  selectedFields: string[];
  hideCompletedTasks: boolean;
}

interface TaskGroup {
  label: string;
  items: Task[];
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

export function useFilterTaskList(taskList: Task[]) {
  const {
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedFields,
    hideCompletedTasks,
  } = useAppContext();
  return useMemo(() => {
    return filterTaskList(taskList, {
      searchTerm,
      selectedPriorities,
      selectedProjects,
      selectedContexts,
      selectedFields,
      hideCompletedTasks,
    });
  }, [
    taskList,
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedFields,
    hideCompletedTasks,
  ]);
}

export function useTaskGroup(taskList: Task[]) {
  const { sortBy } = useAppContext();
  const filteredTaskList = useFilterTaskList(taskList);
  const formatGroupLabel = useFormatGroupLabel();
  return useMemo(
    () =>
      convertToTaskGroups(filteredTaskList, sortBy).map((item) =>
        formatGroupLabel(item, sortBy)
      ),
    [filteredTaskList, sortBy, formatGroupLabel]
  );
}

export function filterTaskList(taskList: Task[], filter: TaskListFilter) {
  const {
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedFields,
    hideCompletedTasks,
  } = filter;

  const activeFilter =
    searchTerm.length > 1 ||
    selectedPriorities.length > 0 ||
    selectedProjects.length > 0 ||
    selectedContexts.length > 0 ||
    selectedFields.length > 0;

  const filteredList = taskList.filter((task) => {
    const searchMatch =
      searchTerm.length > 1 &&
      task.body.toLowerCase().includes(searchTerm.toLowerCase());

    if (hideCompletedTasks && task.completed) {
      return false;
    }

    const priorityMatch =
      selectedPriorities.length > 0 &&
      selectedPriorities.some(
        (selectedPriority) => task.priority === selectedPriority
      );

    const projectMatch =
      selectedProjects.length > 0 &&
      selectedProjects.some((selectedProject) =>
        task.projects.includes(selectedProject)
      );

    const contextMatch =
      selectedContexts.length > 0 &&
      selectedContexts.some((selectedContext) =>
        task.contexts.includes(selectedContext)
      );

    const fieldsMatch =
      selectedFields.length > 0 &&
      selectedFields.some((selectedField) =>
        Object.keys(task.fields).includes(selectedField)
      );

    return activeFilter
      ? searchMatch ||
          priorityMatch ||
          projectMatch ||
          contextMatch ||
          fieldsMatch
      : true;
  });

  return filteredList.sort(sortByOriginalOrder);
}

export function convertToTaskGroups(taskList: Task[], sortBy: SortKey) {
  const groups = groupBy(taskList.sort(sortByOriginalOrder), (task) =>
    getGroupKey(task, sortBy)
  );
  return Object.entries(groups)
    .map(mapGroups)
    .sort((a, b) => sortGroups(a, b, sortBy));
}

function useFormatGroupLabel() {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  return useCallback(
    (group: TaskGroup, sortBy: SortKey) => {
      if (sortBy === "priority" && !group.label) {
        const label = t("Without priority");
        return { ...group, label };
      } else if (sortBy === "context" && !group.label) {
        const label = t("Without context");
        return { ...group, label };
      } else if (sortBy === "project" && !group.label) {
        const label = t("Without project");
        return { ...group, label };
      } else if (sortBy === "tag" && !group.label) {
        const label = t("Without tag");
        return { ...group, label };
      } else if (sortBy === "dueDate" && !group.label) {
        const label = t("Without due date");
        return { ...group, label };
      } else if (sortBy === "dueDate" && group.label) {
        const date = parseDate(group.label);
        const label = date ? formatLocaleDate(date, language) : group.label;
        return { ...group, label };
      } else {
        return group;
      }
    },
    [language, t]
  );
}

function getGroupKey(task: Task, sortBy: SortKey) {
  if (sortBy === "dueDate") {
    return task.dueDate ? formatDate(task.dueDate) : "";
  } else if (sortBy === "priority") {
    return task.priority || "";
  } else if (sortBy === "context") {
    return task.contexts.length > 0 ? task.contexts : "";
  } else if (sortBy === "project") {
    return task.projects.length > 0 ? task.projects : "";
  } else if (sortBy === "tag") {
    return Object.keys(task.fields).length > 0 ? Object.keys(task.fields) : "";
  } else {
    return "";
  }
}

function mapGroups([label, items]: [string, Task[]]): TaskGroup {
  return {
    label,
    items,
  };
}

function sortGroups(a: TaskGroup, b: TaskGroup, sortBy: SortKey) {
  if (
    sortBy === "priority" ||
    sortBy === "context" ||
    sortBy === "project" ||
    sortBy === "tag"
  ) {
    return sortByKey(a.label, b.label);
  } else if (sortBy === "dueDate") {
    return sortByDate(a.label, b.label);
  } else {
    return -1;
  }
}

function sortByKey(a?: string, b?: string) {
  if (a && !b) {
    return -1;
  } else if (!a && b) {
    return 1;
  } else if (!a && !b) {
    return 0;
  } else if (a && b && a > b) {
    return 1;
  } else if (a && b && a < b) {
    return -1;
  } else {
    return 0;
  }
}

function sortByDate(a?: string, b?: string) {
  const aDate = a ? parseDate(a) : undefined;
  const bDate = b ? parseDate(b) : undefined;
  if (aDate && !bDate) {
    return -1;
  } else if (!aDate && bDate) {
    return 1;
  } else if (!aDate && !bDate) {
    return 0;
  } else if (aDate && bDate && isAfter(aDate, bDate)) {
    return 1;
  } else if (aDate && bDate && isBefore(aDate, bDate)) {
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
