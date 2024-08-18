import { expect, test } from "@playwright/test";
import {
  createExampleFile,
  createFile,
  goto,
  openFileMenu,
  openSettings,
  toggleMenu,
} from "./playwright-utils";

test.beforeEach(async ({ page }) => {
  await goto(page);
  await createExampleFile(page);
});

test.describe("Download", () => {
  test("should download a todo.txt file", async ({ page }) => {
    await openFileMenu(page);
    await page.getByLabel("File actions").click();
    const [download] = await Promise.all([
      // Start waiting for the download
      page.waitForEvent("download"),
      // Perform the action that initiates download
      page.getByRole("menuitem", { name: "Download todo.txt" }).click(),
    ]);
    // Wait for the download process to complete
    await download.path();
    expect(download.suggestedFilename()).toBe("todo.txt");
  });

  test("should download todo.txt and done.txt", async ({ page }) => {
    // activate archiving
    await openSettings(page);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive automatically").click();
    await createFile(page);
    await toggleMenu(page);

    await openFileMenu(page);
    await page.getByLabel("File actions").click();
    const [download] = await Promise.all([
      // Start waiting for the download
      page.waitForEvent("download"),
      // Perform the action that initiates download
      page.getByRole("menuitem", { name: "Download todo.txt" }).click(),
    ]);
    // Wait for the download process to complete
    await download.path();
    const filename = download.suggestedFilename();
    expect(/todo_.*.zip/.test(filename)).toBe(true);
  });
});
