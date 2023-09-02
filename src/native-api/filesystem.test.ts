import { getFileNameWithoutExt, join } from "@/native-api/filesystem";
import { describe, expect, it } from "vitest";

describe("filesystem", () => {
  it("should return the filename without its extension", async () => {
    const filepath = "/path/to/file.tmp.txt";
    expect(getFileNameWithoutExt(filepath)).toBe("file.tmp");
  });

  it("should return the filename without its extension on Windows", async () => {
    const filepath = "C:\\path\\to\\file.tmp.txt";
    expect(getFileNameWithoutExt(filepath)).toBe("file.tmp");
  });

  it("should join two paths", async () => {
    const path1 = "/path/to";
    const path2 = "file.tmp.txt";
    const joinedPath = await join(path1, path2);
    expect(joinedPath).toBe("/path/to/file.tmp.txt");
  });
});
