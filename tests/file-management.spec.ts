import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

const withoutFile = [
  "should display an error notification if a todo.txt file cannot be found",
];

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("http://localhost:5173");
  if (!withoutFile.includes(testInfo.title)) {
    const content = readFileSync("public/todo.txt");
    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo1.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo2.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
  }
});

test.describe("File Management", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should order task lists using drag and drop", async ({ page }) => {
    // show all task lists
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByLabel("All task lists").click();

    // open file management dialog
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "Files…" }).click();

    // check current sort order
    await expect(page.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("listitem").first()).toHaveText("todo1.txt");
    await expect(page.getByRole("listitem").nth(1)).toHaveText("todo2.txt");

    // swap order of the two files via drag & drop
    const source = page.getByLabel("Draggable file todo2.txt");
    const destination = page.getByLabel("Draggable file todo1.txt");
    const destinationPosition = await destination.boundingBox();
    await source.hover();
    await page.mouse.down();
    await page.mouse.move(
      destinationPosition!.x + destinationPosition!.width / 2,
      destinationPosition!.y + destinationPosition!.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    // check new sort order
    await expect(page.getByRole("listitem").first()).toHaveText("todo2.txt");
    await expect(page.getByRole("listitem").nth(1)).toHaveText("todo1.txt");
  });

  test("should close a todo.txt file", async ({ page }) => {
    // open file management dialog
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "Files…" }).click();

    // check current number of open files
    await expect(page.getByRole("listitem")).toHaveCount(2);

    await page.getByLabel("File actions").first().click();
    await page.getByLabel("Delete file").click();
    // confirm deletion
    await page.getByLabel("Delete file").click();

    // check number of open files
    await expect(page.getByTestId("draggable-file")).toHaveCount(1);
  });

  test("should display an error notification if a todo.txt file cannot be found", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem("CapacitorStorage.todo-txt-paths", '["todo.txt"]');
    });
    await page.reload();
    await page.evaluate(() => {
      return localStorage["CapacitorStorage.todo-txt-paths"] === "[]";
    });
    await expect(
      page.getByText("File not found: todo.txt").first(),
    ).toBeVisible();
  });
});
