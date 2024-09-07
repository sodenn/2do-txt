import { expect, test } from "@playwright/test";
import { createExampleFile, goto, toggleMenu } from "./playwright-utils";

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
    await toggleMenu(page);

    // check current sort order
    await expect(page.getByLabel("Task list")).toHaveCount(2);
    await expect(page.getByLabel("Task list").first()).toHaveText("todo.txt");
    await expect(page.getByLabel("Task list").nth(1)).toHaveText("todo(1).txt");

    // swap order of the two lists via drag & drop
    const source = page.getByLabel("Draggable list todo(1).txt");
    const destination = page.getByLabel("Draggable list todo.txt");
    await source.hover();
    const destinationPosition = await destination.boundingBox();
    await page.mouse.down();
    await page.mouse.move(
      destinationPosition!.x + destinationPosition!.width / 2,
      destinationPosition!.y + destinationPosition!.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    // check new sort order
    await expect(page.getByLabel("Task list").first()).toHaveText(
      "todo(1).txt",
    );
    await expect(page.getByLabel("Task list").nth(1)).toHaveText("todo.txt");
  });

  test("should close a task lists", async ({ page }) => {
    await toggleMenu(page);

    await expect(page.getByLabel("Task list")).toHaveCount(2);

    await page.getByLabel("List actions").first().click();
    await page.getByLabel("Remove list").click();
    await page.getByRole("button", { name: "Remove" }).click();

    await expect(page.getByTestId("draggable-list")).toHaveCount(1);
  });

  test("should display an error notification if a todo.txt file cannot be found", async ({
    page,
  }) => {
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const dbRequest = indexedDB.open("todo-db");
        dbRequest.onsuccess = () => {
          const transaction = dbRequest.result.transaction(
            ["file-ids-store"],
            "readwrite",
          );
          const store = transaction.objectStore("file-ids-store");
          const putRequest = store.put({
            id: 1,
            items: [{ todoFileId: 10 }],
          });
          putRequest.onsuccess = () => {
            resolve();
          };
          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        };
        dbRequest.onerror = () => {
          reject(dbRequest.error);
        };
      });
    });
    await page.reload();
    await expect(page.getByText("File not found").first()).toBeVisible();
  });
});
