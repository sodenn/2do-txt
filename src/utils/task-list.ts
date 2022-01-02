import { isAfter, isBefore } from "date-fns";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SortKey, useFilter } from "../data/FilterContext";
import { groupBy } from "./array";
import { formatDate, formatLocaleDate, parseDate } from "./date";
import { parseTask, stringifyTask, Task } from "./task";
import { Dictionary } from "./types";

export interface TaskListAttributes {
  priorities: Dictionary<number>;
  projects: Dictionary<number>;
  contexts: Dictionary<number>;
  tags: Dictionary<string[]>;
}

export interface TaskListParseResult extends TaskListAttributes {
  taskList: Task[];
  lineEnding: string;
  incomplete: TaskListAttributes;
}

interface TaskListFilter {
  searchTerm: string;
  selectedPriorities: string[];
  selectedProjects: string[];
  selectedContexts: string[];
  selectedTags: string[];
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

    const attributes = getTaskListAttributes(taskList, false);

    const incompleteTasksAttributes = getTaskListAttributes(taskList, true);

    return {
      taskList,
      lineEnding,
      incomplete: incompleteTasksAttributes,
      ...attributes,
    };
  } else {
    return {
      taskList: [],
      lineEnding: "\n",
      priorities: {},
      projects: {},
      contexts: {},
      tags: {},
      incomplete: {
        priorities: {},
        projects: {},
        contexts: {},
        tags: {},
      },
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
    selectedTags,
    hideCompletedTasks,
  } = useFilter();
  return useMemo(() => {
    return filterTaskList(taskList, {
      searchTerm,
      selectedPriorities,
      selectedProjects,
      selectedContexts,
      selectedTags,
      hideCompletedTasks,
    });
  }, [
    taskList,
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    hideCompletedTasks,
  ]);
}

export function useTaskGroup(taskList: Task[]) {
  const { sortBy } = useFilter();
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
    selectedTags,
    hideCompletedTasks,
  } = filter;

  const activeFilter =
    searchTerm.length > 1 ||
    selectedPriorities.length > 0 ||
    selectedProjects.length > 0 ||
    selectedContexts.length > 0 ||
    selectedTags.length > 0;

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

    const tagsMatch =
      selectedTags.length > 0 &&
      selectedTags.some((selectedTag) =>
        Object.keys(task.tags).includes(selectedTag)
      );

    return activeFilter
      ? searchMatch ||
          priorityMatch ||
          projectMatch ||
          contextMatch ||
          tagsMatch
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

function getTaskListAttributes(
  taskList: Task[],
  incompleteTasksOnly: boolean
): TaskListAttributes {
  const priorities = (
    taskList
      .filter((i) => !incompleteTasksOnly || !i.completed)
      .map((task) => task.priority)
      .filter((priority) => !!priority) as string[]
  ).reduce<Dictionary<number>>((prev, cur) => {
    prev[cur] = (prev[cur] || 0) + 1;
    return prev;
  }, {});

  const projects = taskList
    .filter((i) => !incompleteTasksOnly || !i.completed)
    .flatMap((i) => i.projects)
    .reduce<Dictionary<number>>((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});

  const contexts = taskList
    .filter((i) => !incompleteTasksOnly || !i.completed)
    .flatMap((i) => i.contexts)
    .reduce<Dictionary<number>>((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});

  let tags: Dictionary<string[]> = {};
  taskList
    .filter((i) => !incompleteTasksOnly || !i.completed)
    .forEach((i) => {
      Object.entries(i.tags).forEach(([key, value]) => {
        if (tags[key]) {
          tags[key] = [...tags[key], ...value];
        } else {
          tags[key] = value;
        }
      });
    });

  return {
    priorities,
    projects,
    contexts,
    tags,
  };
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
    return Object.keys(task.tags).length > 0 ? Object.keys(task.tags) : "";
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
