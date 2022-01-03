import { arrayMove } from "./array";
import { convertToTaskGroups, parseTaskList } from "./task-list";

describe("task-list", () => {
  it("should group by context", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxB
3. task`;

    const { taskList } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(taskList, "context");

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

    const { taskList } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(taskList, "tag");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].label).toBe("phone");
    expect(taskGroups[1].label).toBe("");

    expect(taskGroups[0].items.length).toBe(3);
    expect(taskGroups[1].items.length).toBe(1);
  });

  it("should combine contexts when grouping", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxA @CtxB`;

    const { taskList } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(taskList, "context");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].label).toBe("CtxA");
    expect(taskGroups[1].label).toBe("CtxA, CtxB");

    expect(taskGroups[0].items.length).toBe(1);
    expect(taskGroups[1].items.length).toBe(1);
  });

  it("should combine projects when grouping", async () => {
    const todoTxt = `1. task +ProjA
2. task +ProjA +ProjB`;

    const { taskList } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(taskList, "project");

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

    const { taskList } = parseTaskList(todoTxt);
    arrayMove(taskList, 1, 2);
    const taskGroups = convertToTaskGroups(taskList, "context");

    expect(taskGroups.length).toBe(2);

    expect(taskGroups[0].items[0].body).toBe("1. task @CtxA");
    expect(taskGroups[0].items[1].body).toBe("2. task @CtxA");
    expect(taskGroups[1].items[0].body).toBe("3. task @CtxB");
    expect(taskGroups[1].items[1].body).toBe("4. task @CtxB");
  });

  it("should handle tasks that cannot be grouped", async () => {
    const todoTxt = `1. task @CtxA
2. task @CtxB`;

    const { taskList } = parseTaskList(todoTxt);
    const taskGroups = convertToTaskGroups(taskList, "project");

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
});
