import { expect, test } from "@playwright/test";
import { createExampleFile, goto, openFileMenu } from "./playwright-utils";

const withoutFile = [
  "should display an error notification if a todo.txt file cannot be found",
];

test.beforeEach(async ({ page }, testInfo) => {
  await goto(page);
  if (!withoutFile.includes(testInfo.title)) {
    await createExampleFile(page);
    await createExampleFile(page);
  }
});

test.describe("File Management", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should order task lists using drag and drop", async ({ page }) => {
    await openFileMenu(page);

    // check current sort order
    await expect(page.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("listitem").first()).toHaveText("todo.txt");
    await expect(page.getByRole("listitem").nth(1)).toHaveText("todo(1).txt");

    // swap order of the two files via drag & drop
    const source = page.getByLabel("Draggable file todo(1).txt");
    const destination = page.getByLabel("Draggable file todo.txt");
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
    await expect(page.getByRole("listitem").first()).toHaveText("todo(1).txt");
    await expect(page.getByRole("listitem").nth(1)).toHaveText("todo.txt");
  });

  test("should close a todo.txt file", async ({ page }) => {
    await openFileMenu(page);

    // check the current number of open files
    await expect(page.getByRole("listitem")).toHaveCount(2);

    await page.getByLabel("File actions").first().click();
    await page.getByLabel("Close file").click();
    // confirm deletion
    await page.getByLabel("Close file").click();

    // check the number of open files
    await expect(page.getByTestId("draggable-file")).toHaveCount(1);
  });

  test("should display an error notification if a todo.txt file cannot be found", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem("todo-files", '[{"todoFileId":"xyz"}]');
    });
    await page.reload();
    await page.evaluate(() => {
      return localStorage["todo-files"] === "[]";
    });
    await expect(page.getByText("File not found").first()).toBeVisible();
  });
});
