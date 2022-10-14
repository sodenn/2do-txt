import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
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
});

test.describe("Reorder Files", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should allow me to order task lists using drag and drop", async ({
    page,
  }) => {
    // show all task lists
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
    const source = page.locator('[aria-label="Draggable file todo2.txt"]');
    const destination = page.locator('[aria-label="Draggable file todo1.txt"]');
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

  test("should allow me to close a file", async ({ page }) => {
    // open file management dialog
    await page.locator('[aria-label="File menu"]').click();
    await page.locator('[role="menuitem"] >> text="Manage todo.txt"').click();

    // check current number of open files
    await expect(page.locator('[aria-label="File management"] li')).toHaveCount(
      2
    );

    // open the context menu of the first file in the list
    await page.locator('button[aria-label="File actions"]').nth(0).click();

    // click "Delete" in the context menu
    await page.locator('li[aria-label="Delete file"]').click();

    // confirm deletion
    await page.locator('button[aria-label="Delete"]').click();

    // check number of open files
    await expect(page.locator('[aria-label="File management"] li')).toHaveCount(
      1
    );
  });
});
