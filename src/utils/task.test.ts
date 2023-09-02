import {
  createNextRecurringTask,
  parseTask,
  transformPriority,
} from "@/utils/task";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("task priority", () => {
  it("should remove the priority of a completed task", async () => {
    const task = parseTask("x (A) This is a test");

    expect(task.priority).toBe("A");
    expect(task.completed).toBe(true);

    transformPriority(task, "remove");

    expect(task.priority).toBeUndefined();
  });

  it("should not remove the priority of an incomplete task", async () => {
    const task = parseTask("(A) This is a test");

    expect(task.priority).toBe("A");
    expect(task.completed).toBe(false);

    transformPriority(task, "remove");

    expect(task.priority).toBe("A");
  });

  it("should keep the priority of a completed task", async () => {
    const task = parseTask("x (A) This is a test");

    expect(task.priority).toBe("A");
    expect(task.completed).toBe(true);

    transformPriority(task, "keep");

    expect(task.priority).toBe("A");
  });

  it("should archive the priority of a completed task", async () => {
    const task = parseTask("x (A) This is a test");

    expect(task.priority).toBe("A");
    expect(task.completed).toBe(true);

    transformPriority(task, "archive");

    expect(task.priority).toBeUndefined();
    expect(task.tags["pri"]).toStrictEqual(["A"]);
  });

  it("should restore the priority of an incomplete task", async () => {
    const task = parseTask("This is a test pri:A @Test");

    expect(task.priority).toBeUndefined();
    expect(task.completed).toBe(false);

    transformPriority(task, "archive");

    expect(task.priority).toBe("A");
    expect(task.body).toBe("This is a test @Test");
  });
});

describe("recurring tasks", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2022, 5, 1));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("should create next recurring task", async () => {
    const task = parseTask("2022-05-01 This is a test rec:1m due:2022-05-20");
    const recurringTask = createNextRecurringTask(task, true);
    expect(recurringTask).toBeDefined();
    expect(recurringTask!.raw).toBe(
      "2022-06-01 This is a test rec:1m due:2022-07-01",
    );
  });

  it("should create next recurring task in strict mode", async () => {
    const task = parseTask("2022-05-01 This is a test rec:+10m due:2022-05-20");
    const recurringTask = createNextRecurringTask(task, true);
    expect(recurringTask).toBeDefined();
    expect(recurringTask!.raw).toBe(
      "2022-06-01 This is a test rec:+10m due:2023-03-20",
    );
  });

  it("should create next recurring task if there is no due date", async () => {
    const task = parseTask("2022-05-01 This is a test rec:1w");
    const recurringTask = createNextRecurringTask(task, true);
    expect(recurringTask).toBeDefined();
    expect(recurringTask!.raw).toBe(
      "2022-06-01 This is a test rec:1w due:2022-06-08",
    );
  });

  it("should create next recurring task with context", async () => {
    const task = parseTask(
      "2022-05-01 This is a test rec:1w due:2022-05-20 @Test",
    );
    const recurringTask = createNextRecurringTask(task, false);
    expect(recurringTask).toBeDefined();
    expect(recurringTask!.raw).toBe(
      "This is a test rec:1w due:2022-06-08 @Test",
    );
  });

  it("should create next recurring task without creation date (1)", async () => {
    const task = parseTask("2022-05-01 This is a test rec:1w due:2022-05-20");
    const recurringTask = createNextRecurringTask(task, false);
    expect(recurringTask).toBeDefined();
    expect(recurringTask!.raw).toBe("This is a test rec:1w due:2022-06-08");
  });

  it("should create next recurring task without creation date (2)", async () => {
    const task = parseTask("This is a test rec:1w");
    const recurringTask = createNextRecurringTask(task, false);
    expect(recurringTask).toBeDefined();
    expect(recurringTask!.raw).toBe("This is a test rec:1w due:2022-06-08");
  });

  it("should not create next recurring task if rec-tag is missing", async () => {
    const task = parseTask("2022-05-01 This is a test");
    const recurringTask = createNextRecurringTask(task, true);
    expect(recurringTask).toBeUndefined();
  });

  it("should not create next recurring task if rec-tag is invalid (1)", async () => {
    const task = parseTask("2022-05-01 This is a test rec:w1");
    const recurringTask = createNextRecurringTask(task, true);
    expect(recurringTask).toBeUndefined();
  });

  it("should not create next recurring task if rec-tag is invalid (2)", async () => {
    const task = parseTask("2022-05-01 This is a test rec:+1x");
    const recurringTask = createNextRecurringTask(task, true);
    expect(recurringTask).toBeUndefined();
  });
});
