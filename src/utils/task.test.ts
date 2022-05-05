import { parseTask, transformPriority } from "./task";

describe("task", () => {
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
