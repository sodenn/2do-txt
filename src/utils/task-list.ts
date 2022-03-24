import { isAfter, isBefore } from "date-fns";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SortKey, useFilter } from "../data/FilterContext";
import { TaskListState, useTask } from "../data/TaskContext";
import { Dictionary } from "../types/common";
import { groupBy } from "./array";
import { formatDate, formatLocaleDate, parseDate } from "./date";
import { parseTask, stringifyTask, Task } from "./task";

export interface TaskListParseResult extends TaskListAttributes {
  items: Task[];
  lineEnding: string;
  incomplete: TaskListAttributes;
}

export interface TaskListAttributes {
  priorities: Dictionary<number>;
  projects: Dictionary<number>;
  contexts: Dictionary<number>;
  tags: Dictionary<string[]>;
}

export interface TaskGroup {
  label: string;
  items: Task[];
}

interface TaskListFilter {
  searchTerm: string;
  activePriorities: string[];
  activeProjects: string[];
  activeContexts: string[];
  activeTags: string[];
  hideCompletedTasks: boolean;
}

export function parseTaskList(text?: string): TaskListParseResult {
  if (text) {
    const lineEnding = /\r\n/.test(text) ? "\r\n" : "\n";

    const items = text
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t, o) => parseTask(t, o));

    const attributes = getTaskListAttributes(items, false);

    const incompleteTasksAttributes = getTaskListAttributes(items, true);

    return {
      items,
      lineEnding,
      incomplete: incompleteTasksAttributes,
      ...attributes,
    };
  } else {
    return {
      items: [],
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
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  } = useFilter();
  return useMemo(() => {
    return filterTaskList(taskList, {
      searchTerm,
      activePriorities,
      activeProjects,
      activeContexts,
      activeTags,
      hideCompletedTasks,
    });
  }, [
    taskList,
    searchTerm,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  ]);
}

export function useTaskGroups() {
  const { taskLists: _taskLists, activeTaskList } = useTask();
  const taskLists = activeTaskList ? [activeTaskList] : _taskLists;

  const {
    sortBy,
    searchTerm,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  } = useFilter();

  const filteredTaskLists = taskLists.map((taskList) => ({
    ...taskList,
    items: filterTaskList(taskList.items, {
      searchTerm,
      activePriorities,
      activeProjects,
      activeContexts,
      activeTags,
      hideCompletedTasks,
    }),
  }));

  const formatGroupLabel = useFormatGroupLabel();

  return filteredTaskLists.map((filteredTaskList) => ({
    ...filteredTaskList,
    groups: convertToTaskGroups(filteredTaskList.items, sortBy).map((item) =>
      formatGroupLabel(item, sortBy)
    ),
  }));
}

export function filterTaskList(taskList: Task[], filter: TaskListFilter) {
  const {
    searchTerm,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  } = filter;

  const activeFilter =
    searchTerm.length > 1 ||
    activePriorities.length > 0 ||
    activeProjects.length > 0 ||
    activeContexts.length > 0 ||
    activeTags.length > 0;

  const filteredList = taskList.filter((task) => {
    const searchMatch =
      searchTerm.length > 1 &&
      task.body.toLowerCase().includes(searchTerm.toLowerCase());

    if (hideCompletedTasks && task.completed) {
      return false;
    }

    const priorityMatch =
      activePriorities.length > 0 &&
      activePriorities.some(
        (activePriority) => task.priority === activePriority
      );

    const projectMatch =
      activeProjects.length > 0 &&
      activeProjects.some((activeProject) =>
        task.projects.includes(activeProject)
      );

    const contextMatch =
      activeContexts.length > 0 &&
      activeContexts.some((activeContext) =>
        task.contexts.includes(activeContext)
      );

    const tagsMatch =
      activeTags.length > 0 &&
      activeTags.some((activeTag) =>
        Object.keys(task.tags).includes(activeTag)
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

export function getCommonTaskListAttributes(taskLists: TaskListState[]) {
  const projects = reduceDictionaries(taskLists.map((l) => l.projects));
  const tags = reduceDictionaries(taskLists.map((l) => l.tags));
  const contexts = reduceDictionaries(taskLists.map((l) => l.contexts));
  const priorities = reduceDictionaries(taskLists.map((l) => l.priorities));

  const incompleteProjects = reduceDictionaries(
    taskLists.map((l) => l.incomplete.projects)
  );
  const incompleteTags = reduceDictionaries(
    taskLists.map((l) => l.incomplete.tags)
  );
  const incompleteContexts = reduceDictionaries(
    taskLists.map((l) => l.incomplete.contexts)
  );
  const incompletePriorities = reduceDictionaries(
    taskLists.map((l) => l.incomplete.priorities)
  );

  return {
    projects,
    tags,
    contexts,
    priorities,
    incomplete: {
      projects: incompleteProjects,
      tags: incompleteTags,
      contexts: incompleteContexts,
      priorities: incompletePriorities,
    },
  };
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

function reduceDictionaries<T extends number | string[]>(
  dictionaries: Dictionary<T>[]
): Dictionary<T> {
  if (containsNumberDictionaries(dictionaries)) {
    const arr: Dictionary<number>[] = dictionaries;
    const result = arr.reduce((prev, curr) => {
      Object.entries(curr).forEach(([key, value]) => {
        const prevValue = prev[key];
        if (typeof prevValue !== "undefined") {
          prev[key] = prevValue + value;
        } else {
          prev[key] = value;
        }
      });
      return prev;
    }, {});
    return result as any;
  }

  if (containsStringArrayDictionaries(dictionaries)) {
    const arr: Dictionary<string[]>[] = dictionaries;
    const result = arr.reduce((prev, curr) => {
      Object.entries(curr).forEach(([key, value]) => {
        const prevValue = prev[key];
        if (typeof prevValue !== "undefined") {
          prev[key] = [...prevValue, ...value];
        } else {
          prev[key] = value;
        }
      });
      return prev;
    }, {});
    return result as any;
  }

  throw new Error("Unknown dictionary type");
}

function containsNumberDictionaries(
  dictionary: Dictionary<any>[]
): dictionary is Dictionary<number>[] {
  return dictionary.every((dictionary) =>
    Object.values(dictionary).every((v) => typeof v === "number")
  );
}

function containsStringArrayDictionaries(
  dictionary: Dictionary<any>[]
): dictionary is Dictionary<string[]>[] {
  return dictionary.every((dictionary) =>
    Object.values(dictionary).every(
      (v) => Array.isArray(v) && v.every((s) => typeof s === "string")
    )
  );
}
