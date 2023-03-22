import { describe, expect, it } from "vitest";
import { arrayMove } from "./array";
import {
  TaskList,
  TaskListFilter,
  convertToTaskGroups,
  filterTasks,
  getCommonTaskListAttributes,
  parseTaskList,
  sortByOriginalOrder,
} from "./task-list";

describe("task-list", () => {
  it("should group by context", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxB
3. task`;

    const { items } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(items, "context");

    expect(taskGroups.length).toBe(3);

    expect(taskGroups[0].label).toBe("CtxA");
    expect(taskGroups[1].label).toBe("CtxB");
    expect(taskGroups[2].label).toBe("");

    expect(taskGroups[0].items.length).toBe(1);
    expect(taskGroups[1].items.length).toBe(1);
    expect(taskGroups[2].items.length).toBe(1);
  });

  it("should group by tag", async () => {
    const todoTxt = `1. task phone:1234
2. task phone:9876
3. task phone:1234
4. task`;

    const { items } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(items, "tag");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].label).toBe("phone");
    expect(taskGroups[1].label).toBe("");

    expect(taskGroups[0].items.length).toBe(3);
    expect(taskGroups[1].items.length).toBe(1);
  });

  it("should combine contexts when grouping", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxA @CtxB`;

    const { items } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(items, "context");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].label).toBe("CtxA");
    expect(taskGroups[1].label).toBe("CtxA, CtxB");

    expect(taskGroups[0].items.length).toBe(1);
    expect(taskGroups[1].items.length).toBe(1);
  });

  it("should combine projects when grouping", async () => {
    const todoTxt = `1. task +ProjA
2. task +ProjA +ProjB`;

    const { items } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(items, "project");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].label).toBe("ProjA");
    expect(taskGroups[1].label).toBe("ProjA, ProjB");

    expect(taskGroups[0].items.length).toBe(1);
    expect(taskGroups[1].items.length).toBe(1);
  });

  it("should sort grouped tasks by original order", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxA
3. task @CtxB
4. task @CtxB`;

    const { items } = parseTaskList(todoTxt);
    arrayMove(items, 1, 2);
    const taskGroups = convertToTaskGroups(items, "context");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].items[0].body).toBe("1. task @CtxA");
    expect(taskGroups[0].items[1].body).toBe("2. task @CtxA");
    expect(taskGroups[1].items[0].body).toBe("3. task @CtxB");
    expect(taskGroups[1].items[1].body).toBe("4. task @CtxB");
  });

  it("should handle tasks that cannot be grouped", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxB`;

    const { items } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(items, "project");

    expect(taskGroups.length).toBe(1);

    expect(taskGroups[0].label).toBe("");

    expect(taskGroups[0].items.length).toBe(2);
  });

  it("should contain projects of incomplete tasks", async () => {
    const todoTxt = `x 1. task +ProjA
x 2. task +ProjB
3. task +ProjA`;

    const { projects, incomplete } = parseTaskList(todoTxt);

    expect(projects.ProjA).toBe(2);
    expect(projects.ProjB).toBe(1);

    expect(incomplete.projects.ProjA).toBe(1);
    expect(incomplete.projects.ProjB).toBeUndefined();
  });

  it("should produce the same result when comparing a task list with a group of task lists with one entry", async () => {
    const todoTxt = `x 1. task +ProjA
x 2. task +ProjB
3. task +ProjA`;

    const parseResult = parseTaskList(todoTxt);

    const attributes = {
      projects: parseResult.projects,
      contexts: parseResult.contexts,
      tags: parseResult.tags,
      priorities: parseResult.priorities,
      incomplete: parseResult.incomplete,
    };

    const taskLists: TaskList[] = [
      {
        ...parseResult,
        filePath: import.meta.env.VITE_DEFAULT_FILE_NAME!,
        fileName: import.meta.env.VITE_DEFAULT_FILE_NAME!,
      },
    ];

    const commonAttributes = getCommonTaskListAttributes(taskLists);

    expect(attributes).toEqual(commonAttributes);
  });

  it("should correctly add tags from multiple lists", async () => {
    const todoTxt = `1. task due:2021-11-30
2. task due:2021-11-15`;

    const parseResult = parseTaskList(todoTxt);

    const taskLists: TaskList[] = [
      {
        ...parseResult,
        filePath: "todo1.txt",
        fileName: "todo1.txt",
      },
      {
        ...parseResult,
        filePath: "todo2.txt",
        fileName: "todo2.txt",
      },
    ];

    const attributes = {
      projects: {},
      contexts: {},
      priorities: {},
      tags: {
        due: ["2021-11-30", "2021-11-15", "2021-11-30", "2021-11-15"],
      },
      incomplete: {
        projects: {},
        contexts: {},
        priorities: {},
        tags: {
          due: ["2021-11-30", "2021-11-15", "2021-11-30", "2021-11-15"],
        },
      },
    };

    const commonAttributes = getCommonTaskListAttributes(taskLists);

    expect(attributes).toEqual(commonAttributes);
  });

  it("should ANDed multiple filter conditions when using the AND filter type", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxB
3. task +ProjA @CtxA @CtxC @CtxD`;

    const { items } = parseTaskList(todoTxt);

    const filter: TaskListFilter = {
      type: "AND",
      searchTerm: "",
      activeContexts: ["CtxA", "CtxD"],
      activePriorities: [],
      activeProjects: ["ProjA"],
      activeTags: [],
      hideCompletedTasks: false,
    };

    const filteredList = filterTasks(items, filter).sort(sortByOriginalOrder);

    expect(filteredList.length).toBe(1);

    expect(filteredList[0].body).toBe("3. task +ProjA @CtxA @CtxC @CtxD");
  });

  it("should combine filter including search term when using the AND filter type", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxB
3. task +ProjA @CtxC`;

    const { items } = parseTaskList(todoTxt);

    const filter: TaskListFilter = {
      type: "AND",
      searchTerm: "3. task",
      activeContexts: [],
      activePriorities: [],
      activeProjects: ["ProjA"],
      activeTags: [],
      hideCompletedTasks: false,
    };

    const filteredList = filterTasks(items, filter).sort(sortByOriginalOrder);

    expect(filteredList.length).toBe(1);

    expect(filteredList[0].body).toBe("3. task +ProjA @CtxC");
  });

  it("should combine multiple filters when using the OR filter type", async () => {
    const todoTxt = `1. task @CtxA
2. task +ProjA @CtxB
3. task +ProjB @CtxA @CtxB`;

    const { items } = parseTaskList(todoTxt);

    const filter: TaskListFilter = {
      type: "OR",
      searchTerm: "",
      activeContexts: ["CtxA", "CtxB"],
      activePriorities: [],
      activeProjects: ["ProjB"],
      activeTags: [],
      hideCompletedTasks: false,
    };

    const filteredList = filterTasks(items, filter).sort(sortByOriginalOrder);

    expect(filteredList.length).toBe(3);
  });

  it("should hide completed tasks", async () => {
    const todoTxt = `x 1. task +ProjA
2. task +ProjB
3. task +ProjA`;

    const { items } = parseTaskList(todoTxt);

    const filter: TaskListFilter = {
      type: "AND",
      searchTerm: "",
      activeContexts: [],
      activePriorities: [],
      activeProjects: [],
      activeTags: [],
      hideCompletedTasks: true,
    };

    const filteredList = filterTasks(items, filter).sort(sortByOriginalOrder);

    expect(filteredList.length).toBe(2);
  });
});
