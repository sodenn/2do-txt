import {
  addDays,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameYear,
} from "date-fns";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FilterType, SortKey, useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import { groupBy } from "./array";
import { formatDate, formatLocaleDate, parseDate, todayDate } from "./date";
import { parseTask, stringifyTask, Task } from "./task";

export interface TaskListParseResult extends TaskListAttributes {
  items: Task[];
  lineEnding: string;
  incomplete: TaskListAttributes;
}

export interface TaskList extends TaskListParseResult {
  filePath: string;
  fileName: string;
}

export interface TaskListAttributes {
  priorities: Record<string, number>;
  projects: Record<string, number>;
  contexts: Record<string, number>;
  tags: Record<string, string[]>;
}

export interface TaskGroup {
  label: string;
  items: Task[];
}

export interface TaskListFilter {
  type: FilterType;
  searchTerm: string;
  activePriorities: string[];
  activeProjects: string[];
  activeContexts: string[];
  activeTags: string[];
  hideCompletedTasks: boolean;
}

export interface TimelineTask extends Task {
  _timelineFlags: {
    today: boolean;
    firstOfToday: boolean;
    lastOfToday: boolean;
    firstOfDay: boolean;
    firstOfYear: boolean;
    firstWithoutDate: boolean;
    first: boolean;
    last: boolean;
  };
  _timelineDate?: Date;
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

export function useTimelineTasks(): TimelineTask[] {
  const { taskLists: allTaskLists, activeTaskList } = useTask();
  const taskLists = activeTaskList ? [activeTaskList] : allTaskLists;
  const items = taskLists.flatMap((list) => list.items);
  const {
    filterType,
    searchTerm,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  } = useFilter();

  const filteredTasks = filterTasks(items, {
    type: filterType,
    searchTerm,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  });

  const today = todayDate();

  const futureTasks: TimelineTask[] = filteredTasks
    .map((t) => ({
      ...t,
      _timelineDate: t.dueDate || t.completionDate || t.creationDate,
    }))
    .filter((t) => t._timelineDate && isAfter(t._timelineDate, today))
    .sort((t1, t2) => timelineSort(t1._timelineDate, t2._timelineDate))
    .map((t) => ({
      ...t,
      _timelineFlags: {
        today: false,
        firstOfToday: false,
        lastOfToday: false,
        firstOfDay: false,
        firstOfYear: false,
        firstWithoutDate: false,
        first: false,
        last: false,
      },
    }));

  const dueTasks = filteredTasks
    .filter((t) => t.dueDate && isBefore(t.dueDate, addDays(today, 1)))
    .map((t) => ({ ...t, _timelineDate: today }))
    .sort((a, b) => timelineSort(a.dueDate, b.dueDate, "asc"));

  // +Button
  filteredTasks.unshift({
    _id: "-1",
    _order: 0,
    body: "+",
    completed: false,
    creationDate: today,
    tags: {},
    contexts: [],
    projects: [],
    raw: "+",
  });

  const todayTasks: TimelineTask[] = filteredTasks
    .filter((t) => !t.dueDate)
    .map((t) => ({ ...t, _timelineDate: t.completionDate || t.creationDate }))
    .filter((t) => t._timelineDate && isEqual(t._timelineDate, today))
    .sort((t1, t2) => timelineSort(t1._timelineDate, t2._timelineDate))
    .concat(dueTasks)
    .map((t, i, a) => ({
      ...t,
      _timelineFlags: {
        today: true,
        firstOfToday: i === 0,
        lastOfToday: a.length === i + 1,
        firstOfDay: false,
        firstOfYear: false,
        firstWithoutDate: false,
        first: false,
        last: false,
      },
    }));

  const pastTasks: TimelineTask[] = filteredTasks
    .filter((t) => !t.dueDate)
    .map((t) => ({ ...t, _timelineDate: t.completionDate || t.creationDate }))
    .filter((t) => !t._timelineDate || isBefore(t._timelineDate, today))
    .sort((t1, t2) => timelineSort(t1._timelineDate, t2._timelineDate))
    .map((t) => ({
      ...t,
      _timelineFlags: {
        today: false,
        firstOfToday: false,
        lastOfToday: false,
        firstOfDay: false,
        firstOfYear: false,
        firstWithoutDate: false,
        first: false,
        last: false,
      },
    }));

  return futureTasks
    .concat(todayTasks)
    .concat(pastTasks)
    .map((t, i, a) => ({
      ...t,
      _timelineFlags: {
        ...t._timelineFlags,
        firstOfDay:
          !t._timelineFlags.today &&
          a.find((j) => isSameDay(j._timelineDate!, t._timelineDate!))?._id ===
            t._id,
        firstOfYear:
          (!t._timelineFlags.today || t._timelineFlags.firstOfToday) &&
          a.find((j) => isSameYear(j._timelineDate!, t._timelineDate!))?._id ===
            t._id,
        firstWithoutDate:
          !t._timelineDate && a.find((j) => !j._timelineDate)?._id === t._id,
        first: i === 0,
        last: a.length === i + 1,
      },
    }));
}

export function useTaskGroups() {
  let { taskLists, activeTaskList } = useTask();
  taskLists = activeTaskList ? [activeTaskList] : taskLists;

  const {
    sortBy,
    searchTerm,
    filterType,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  } = useFilter();

  const filteredTaskLists = taskLists.map((taskList) => ({
    ...taskList,
    items: filterTasks(taskList.items, {
      type: filterType,
      searchTerm,
      activePriorities,
      activeProjects,
      activeContexts,
      activeTags,
      hideCompletedTasks,
    }).sort(sortByOriginalOrder),
  }));

  const formatGroupLabel = useFormatGroupLabel();

  return filteredTaskLists.map((filteredTaskList) => ({
    ...filteredTaskList,
    groups: convertToTaskGroups(filteredTaskList.items, sortBy).map((item) =>
      formatGroupLabel(item, sortBy)
    ),
  }));
}

function andTypePredicate(
  hideCompletedTasks: boolean,
  searchTerm: string,
  activePriorities: string[],
  activeProjects: string[],
  activeContexts: string[],
  activeTags: string[]
) {
  return (task: Task) => {
    if (hideCompletedTasks && task.completed) {
      return false;
    }

    const searchCondition =
      searchTerm.length === 0 ||
      task.body.toLowerCase().includes(searchTerm.toLowerCase());

    const priorityCondition =
      activePriorities.length === 0 ||
      activePriorities.every(
        (activePriority) => task.priority === activePriority
      );

    const projectCondition =
      activeProjects.length === 0 ||
      activeProjects.every((activeProject) =>
        task.projects.includes(activeProject)
      );

    const contextCondition =
      activeContexts.length === 0 ||
      activeContexts.every((activeContext) =>
        task.contexts.includes(activeContext)
      );

    const tagsCondition =
      activeTags.length === 0 ||
      activeTags.every((activeTag) =>
        Object.keys(task.tags).includes(activeTag)
      );

    return (
      searchCondition &&
      priorityCondition &&
      projectCondition &&
      contextCondition &&
      tagsCondition
    );
  };
}

function orTypePredicate(
  hideCompletedTasks: boolean,
  searchTerm: string,
  activePriorities: string[],
  activeProjects: string[],
  activeContexts: string[],
  activeTags: string[]
) {
  return (task: Task) => {
    const filterDisabled =
      searchTerm.length === 0 &&
      activePriorities.length === 0 &&
      activeProjects.length === 0 &&
      activeContexts.length === 0 &&
      activeTags.length === 0;

    if (hideCompletedTasks && task.completed) {
      return false;
    }

    if (filterDisabled) {
      return true;
    }

    const searchCondition =
      searchTerm.length > 0 &&
      task.body.toLowerCase().includes(searchTerm.toLowerCase());

    const priorityCondition = activePriorities.some(
      (activePriority) => task.priority === activePriority
    );

    const projectCondition = activeProjects.some((activeProject) =>
      task.projects.includes(activeProject)
    );

    const contextCondition = activeContexts.some((activeContext) =>
      task.contexts.includes(activeContext)
    );

    const tagsCondition = activeTags.some((activeTag) =>
      Object.keys(task.tags).includes(activeTag)
    );

    return (
      searchCondition ||
      priorityCondition ||
      projectCondition ||
      contextCondition ||
      tagsCondition
    );
  };
}

export function filterTasks<T extends Task>(
  tasks: T[],
  filter: TaskListFilter
) {
  const {
    type,
    searchTerm,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    hideCompletedTasks,
  } = filter;
  return tasks.filter(
    type === "OR"
      ? orTypePredicate(
          hideCompletedTasks,
          searchTerm,
          activePriorities,
          activeProjects,
          activeContexts,
          activeTags
        )
      : andTypePredicate(
          hideCompletedTasks,
          searchTerm,
          activePriorities,
          activeProjects,
          activeContexts,
          activeTags
        )
  );
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
  const priorities = taskList
    .filter((i) => !incompleteTasksOnly || !i.completed)
    .map((task) => task.priority)
    .filter((priority): priority is string => !!priority)
    .reduce<Record<string, number>>((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});

  const projects = taskList
    .filter((i) => !incompleteTasksOnly || !i.completed)
    .flatMap((i) => i.projects)
    .reduce<Record<string, number>>((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});

  const contexts = taskList
    .filter((i) => !incompleteTasksOnly || !i.completed)
    .flatMap((i) => i.contexts)
    .reduce<Record<string, number>>((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});

  let tags: Record<string, string[]> = {};
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

export function getCommonTaskListAttributes(taskLists: TaskList[]) {
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
    return groupSortByKey(a.label, b.label);
  } else if (sortBy === "dueDate") {
    return groupSortByDate(a.label, b.label);
  } else {
    return -1;
  }
}

function groupSortByKey(a?: string, b?: string) {
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

function groupSortByDate(a?: string, b?: string) {
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

function timelineSort(a?: Date, b?: Date, direction: "asc" | "desc" = "desc") {
  if (a && !b) {
    return -1;
  } else if (!a && b) {
    return 0;
  } else if (!a && !b) {
    return 0;
  } else if (a && b && isAfter(a, b)) {
    return direction === "desc" ? -1 : 1;
  } else if (a && b && isBefore(a, b)) {
    return direction === "desc" ? 1 : -1;
  } else {
    return 0;
  }
}

function reduceDictionaries<T extends number | string[]>(
  dictionaries: Record<string, T>[]
): Record<string, T> {
  if (containsNumberDictionaries(dictionaries)) {
    const arr: Record<string, number>[] = dictionaries;
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
    const arr: Record<string, string[]>[] = dictionaries;
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
  dictionary: Record<string, any>[]
): dictionary is Record<string, number>[] {
  return dictionary.every((dictionary) =>
    Object.values(dictionary).every((v) => typeof v === "number")
  );
}

function containsStringArrayDictionaries(
  dictionary: Record<string, any>[]
): dictionary is Record<string, string[]>[] {
  return dictionary.every((dictionary) =>
    Object.values(dictionary).every(
      (v) => Array.isArray(v) && v.every((s) => typeof s === "string")
    )
  );
}
