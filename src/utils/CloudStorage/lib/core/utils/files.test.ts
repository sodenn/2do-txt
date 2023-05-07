import { describe, expect, it } from "vitest";
import { createChecksum, getDirname, getFilename } from "./files";

describe("files", () => {
  it("should get filename from path", async () => {
    const filename = getFilename("/folder1/test.txt");
    expect(filename).toBe("test.txt");
  });

  it("should get filename with dot from path", async () => {
    const filename = getFilename("/folder1/test.spec.txt");
    expect(filename).toBe("test.spec.txt");
  });

  it("should get filename from URL", async () => {
    const filename = getFilename("https://example.com/folder1/test.spec.txt");
    expect(filename).toBe("test.spec.txt");
  });

  it("should return the directory name from a file path", async () => {
    const dirname = getDirname("/folder1/test.txt");
    expect(dirname).toBe("/folder1");
  });

  it("should return the parent directory", async () => {
    const dirname = getDirname("/folder1/folder2");
    expect(dirname).toBe("/folder1");
  });

  it("should return the root directory if the root directory is specified", async () => {
    const dirname = getDirname("/");
    expect(dirname).toBe("/");
  });

  it("Should get the parent directory of a deep nested folder", async () => {
    const dirname = getDirname("/folder1/folder2/folder3");
    expect(dirname).toBe("/folder1/folder2");
  });

  it("should get the parent directory without a trailing slash even if the given directory has a trailing slash", async () => {
    const dirname = getDirname("/folder1/folder2/");
    expect(dirname).toBe("/folder1");
  });

  it("should get the root directory if the given directory is in the root directory", async () => {
    const dirname = getDirname("/folder1");
    expect(dirname).toBe("/");
  });

  it("should create a checksum from a string", async () => {
    const checksum = await createChecksum("This is a test");
    expect(checksum).toBe("a54d88e06612d820bc3be72877c74f257b561b19");
  });

  it("should create a checksum from an array buffer", async () => {
    const buffer = new TextEncoder().encode("This is a test");
    const checksum = await createChecksum(buffer);
    expect(checksum).toBe("a54d88e06612d820bc3be72877c74f257b561b19");
    const decoder = new TextDecoder();
    const str = decoder.decode(buffer);
    expect(str).toBe("This is a test");
  });
});
