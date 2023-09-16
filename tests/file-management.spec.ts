import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

const withoutFile = [
  "should display an error notification if a file cannot be found",
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

  test("should allow me to order task lists using drag and drop", async ({
    page,
  }) => {
    // show all task lists
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "All" }).click();

    // open file management dialog
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "Files…" }).click();

    // check current sort order
    await expect(page.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("listitem").nth(0)).toHaveText("todo1.txt");
    await expect(page.getByRole("listitem").nth(1)).toHaveText("todo2.txt");

    // swap order of the two files via drag & drop
    const source = page.getByRole("button", {
      name: "Draggable file todo2.txt",
    });
    const destination = page.getByRole("button", {
      name: "Draggable file todo1.txt",
    });
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
    await expect(page.getByRole("listitem").nth(0)).toHaveText("todo2.txt");
    await expect(page.getByRole("listitem").nth(1)).toHaveText("todo1.txt");
  });

  test("should allow me to close a file", async ({ page }) => {
    // open file management dialog
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "Files…" }).click();

    // check current number of open files
    await expect(page.getByRole("listitem")).toHaveCount(2);

    // open the menu of the first file in the list
    await page.getByRole("button", { name: "File actions" }).nth(0).click();

    // click "Delete" in the context menu
    await page
      .getByRole("menuitem", {
        name: "Delete file",
      })
      .click();

    // confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // check number of open files
    await expect(page.getByTestId("draggable-file")).toHaveCount(1);
  });

  test("should display an error notification if a file cannot be found", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem("CapacitorStorage.todo-txt-paths", '["todo.txt"]');
    });
    await page.reload();
    await expect(page.getByRole("alert")).toHaveText(
      "File not found: todo.txt",
    );
    await page.evaluate(() => {
      return localStorage["CapacitorStorage.todo-txt-paths"] === "[]";
    });
  });
});
