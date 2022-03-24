import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
});

test.describe("Reorder Files", () => {
  // webkit: Selecting multiple files does not work in the test
  // eslint-disable-next-line jest/valid-title
  test.skip(({ browserName }) => browserName === "webkit");

  test("should allow me to order file lists using drag and drop", async ({
    page,
  }) => {
    const content = readFileSync("resources/todo.txt");

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

    // show all files
    await page.locator('[aria-label="File menu"]').click();
    await page.locator('[role="menuitem"] >> text=All').click();

    // open file management dialog
    await page.locator('[aria-label="File menu"]').click();
    await page.locator('[role="menuitem"] >> text="Manage todo.txt"').click();

    // check current sort order
    await expect(page.locator("h5")).toHaveCount(2);
    await expect(page.locator("h5").nth(0)).toHaveText("todo1.txt");
    await expect(page.locator("h5").nth(1)).toHaveText("todo2.txt");

    // swap order of the two files via drag & drop

    const source = page.locator(
      '[data-rbd-drag-handle-draggable-id="todo2.txt"]'
    );

    const destination = page.locator(
      '[data-rbd-drag-handle-draggable-id="todo1.txt"]'
    );

    const destinationPosition = await destination.boundingBox();

    await source.hover();

    await page.mouse.down();

    await page.mouse.move(
      destinationPosition!.x + destinationPosition!.width / 2,
      destinationPosition!.y + destinationPosition!.height / 2,
      { steps: 10 }
    );

    await page.mouse.up();

    // check new sort order
    await expect(page.locator("h5").nth(0)).toHaveText("todo2.txt");
    await expect(page.locator("h5").nth(1)).toHaveText("todo1.txt");
  });
});
