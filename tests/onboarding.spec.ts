import { expect, test } from "@playwright/test";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  createExampleFile,
  createTask,
  goto,
  openFileMenu,
  toggleMenu,
} from "./playwright-utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    await expect(page.getByLabel("Import list")).toBeFocused();
  });
});

test.describe("New file", () => {
  test("should create a new list", async ({ page }) => {
    await createTask(page);
    // The task dialog should open and the focus should be in the editor on desktop
    await expect(
      page.getByRole("textbox", { name: "Text editor" }),
    ).toBeFocused();
    // close the current file and create a new one and the same way
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("task-dialog")).not.toBeVisible();
    await toggleMenu(page);
    await page.getByLabel("List actions").click();
    await page.getByLabel("Remove list").click();
    await page.getByRole("button", { name: "Remove" }).click();
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
    let fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Import list" }).click();
    let fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(join(__dirname, "..", "public/todo.txt"));

    await expect(
      page.getByRole("button", { name: "todo1.txt", exact: true }),
    ).not.toBeVisible();

    await openFileMenu(page);
    fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Import list" }).click();
    fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(join(__dirname, "..", "public/todo.txt"));

    await expect(page.getByTestId("task")).toHaveCount(16);
    await expect(page.getByRole("button", { name: "todo.txt" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "todo(1).txt" }),
    ).toBeVisible();

    await openFileMenu(page);
    await expect(
      page.getByRole("menuitemcheckbox", { name: "todo.txt" }),
    ).toBeChecked();
    await expect(
      page.getByRole("menuitemcheckbox", { name: "todo(1).txt" }),
    ).toBeChecked();
  });
});
