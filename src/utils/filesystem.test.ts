import { getArchivalFilePath } from "./filesystem";

describe("filesystem", () => {
  it("should get archival file path from long source path", async () => {
    const filePath = "/Documents/todo.txt";
    const archivalFilePath = getArchivalFilePath(filePath);
    expect(archivalFilePath).toBe("/Documents/done.txt");
  });

  it("should get archival file path from short source path", async () => {
    const filePath = "todo.txt";
    const archivalFilePath = getArchivalFilePath(filePath);
    expect(archivalFilePath).toBe("done.txt");
  });

  it("should return undefined if archival file path cannot be created", async () => {
    const filePath = ".txt";
    const archivalFilePath = getArchivalFilePath(filePath);
    expect(archivalFilePath).toBeUndefined();
  });

  it("should get archival file path with prefix (1)", async () => {
    const filePath = "/Documents/test.txt";
    const archivalFilePath = getArchivalFilePath(filePath);
    expect(archivalFilePath).toBe("/Documents/test_done.txt");
  });

  it("should get archival file path with prefix (2)", async () => {
    const filePath = "todo_test.txt";
    const archivalFilePath = getArchivalFilePath(filePath);
    expect(archivalFilePath).toBe("todo_test_done.txt");
  });
});
