import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";
import {
  createExampleFile,
  createTask,
  goto,
  openFileMenu,
} from "./playwright-utils";

test.beforeEach(async ({ page }) => {
  await goto(page);
});

test.describe("Onboarding", () => {
  test("should tab through the onboarding buttons", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Create task")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Create example list")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Import todo.txt")).toBeFocused();
  });
});

test.describe("New file", () => {
  test("should create a new todo.txt file", async ({ page }) => {
    await createTask(page);
    // The task dialog should open and the focus should be in the editor on desktop
    await expect(
      page.getByRole("textbox", { name: "Text editor" }),
    ).toBeFocused();
    // close the current file and create a new one and the same way
    await page.keyboard.press("Escape");
    await openFileMenu(page);
    await page.getByLabel("File actions").click();
    await page.getByLabel("Remove list").click();
    await page.getByLabel("Remove list confirmation").click();
    await expect(page.getByText("Get Started")).toBeVisible();
  });
});

test.describe("Example file", () => {
  test("should create an example todo.txt file", async ({ page }) => {
    await createExampleFile(page);
    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});

test.describe("File import", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should import a todo.txt file", async ({ page }) => {
    const content = readFileSync("public/todo.txt");
    await page.getByRole("button", { name: "Import todo.txt" }).click();
    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo1.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    await expect(
      page.getByRole("button", { name: "todo1.txt", exact: true }),
    ).not.toBeVisible();

    await openFileMenu(page);
    await page.getByRole("button", { name: "Import todo.txt" }).click();
    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo2.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    await expect(page.getByTestId("task")).toHaveCount(16);
    await expect(
      page.getByRole("button", { name: "todo1.txt", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "todo2.txt", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "File menu" }).click();
    await expect(
      page.getByRole("menuitemcheckbox", { name: "All task lists" }),
    ).toBeChecked();
  });
});
