import { getArchiveFilePath } from "./filesystem";

describe("filesystem", () => {
  it("should get archive file path from long source path", async () => {
    const filePath = `/Documents/${process.env.REACT_APP_DEFAULT_FILE_NAME}`;
    const archiveFilePath = getArchiveFilePath(filePath);
    expect(archiveFilePath).toBe("/Documents/done.txt");
  });

  it("should get archive file path from short source path", async () => {
    const filePath = process.env.REACT_APP_DEFAULT_FILE_NAME;
    const archiveFilePath = getArchiveFilePath(filePath);
    expect(archiveFilePath).toBe("done.txt");
  });

  it("should return undefined if archive file path cannot be created", async () => {
    const filePath = ".txt";
    const archiveFilePath = getArchiveFilePath(filePath);
    expect(archiveFilePath).toBeUndefined();
  });

  it("should get archive file path with prefix (1)", async () => {
    const filePath = "/Documents/test.txt";
    const archiveFilePath = getArchiveFilePath(filePath);
    expect(archiveFilePath).toBe("/Documents/test_done.txt");
  });

  it("should get archive file path with prefix (2)", async () => {
    const filePath = "todo_test.txt";
    const archiveFilePath = getArchiveFilePath(filePath);
    expect(archiveFilePath).toBe("todo_test_done.txt");
  });
});
