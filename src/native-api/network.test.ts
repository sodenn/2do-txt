import { describe, expect, it } from "vitest";
import { joinURL } from "./network";

describe("network", () => {
  it("it should add a slash between parts", async () => {
    const baseUrl = "https://demo.owncloud.org/remote.php/webdav";
    const path = "Documents/todo";
    const url = joinURL(baseUrl, path);
    expect(url).toBe(
      "https://demo.owncloud.org/remote.php/webdav/Documents/todo",
    );
  });

  it("it should only be one slash between the parts (1)", async () => {
    const baseUrl = "https://demo.owncloud.org/remote.php/webdav/";
    const path = "Documents/todo";
    const url = joinURL(baseUrl, path);
    expect(url).toBe(
      "https://demo.owncloud.org/remote.php/webdav/Documents/todo",
    );
  });

  it("it should only be one slash between the parts (2)", async () => {
    const baseUrl = "https://demo.owncloud.org/remote.php/webdav";
    const path = "/Documents/todo";
    const url = joinURL(baseUrl, path);
    expect(url).toBe(
      "https://demo.owncloud.org/remote.php/webdav/Documents/todo",
    );
  });

  it("it should keep the slash at the end of the path", async () => {
    const baseUrl = "https://demo.owncloud.org/remote.php/webdav";
    const path = "Documents/todo/";
    const url = joinURL(baseUrl, path);
    expect(url).toBe(
      "https://demo.owncloud.org/remote.php/webdav/Documents/todo/",
    );
  });

  it("it should be a maximum of one slash at the end", async () => {
    const baseUrl = "https://demo.owncloud.org/remote.php/webdav/";
    const path = "/";
    const url = joinURL(baseUrl, path);
    expect(url).toBe("https://demo.owncloud.org/remote.php/webdav/");
  });

  it("it should not remove standalone slashes", async () => {
    const url = joinURL("/", "/");
    expect(url).toBe("/");
  });
});
