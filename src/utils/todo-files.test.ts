import { describe, expect, it } from "vitest";
import { getDoneFilePath } from "./todo-files";

describe("todo-files", () => {
  it("should get done file path from long source path", async () => {
    const filePath = `/Documents/${import.meta.env.VITE_DEFAULT_FILE_NAME}`;
    const doneFilePath = getDoneFilePath(filePath);
    expect(doneFilePath).toBe("/Documents/done.txt");
  });

  it("should get done file path from short source path", async () => {
    const filePath = import.meta.env.VITE_DEFAULT_FILE_NAME!;
    const doneFilePath = getDoneFilePath(filePath);
    expect(doneFilePath).toBe("done.txt");
  });

  it("should return undefined if done file path cannot be created", async () => {
    const filePath = ".txt";
    const doneFilePath = getDoneFilePath(filePath);
    expect(doneFilePath).toBeUndefined();
  });

  it("should get done file path with prefix (1)", async () => {
    const filePath = "/Documents/test.txt";
    const doneFilePath = getDoneFilePath(filePath);
    expect(doneFilePath).toBe("/Documents/test_done.txt");
  });

  it("should get done file path with prefix (2)", async () => {
    const filePath = "todo_test.txt";
    const doneFilePath = getDoneFilePath(filePath);
    expect(doneFilePath).toBe("todo_test_done.txt");
  });
});
