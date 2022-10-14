import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await page.waitForTimeout(100);
});

test.describe("Download", () => {
  test("should download a todo.txt file", async ({ page }) => {
    const [download] = await Promise.all([
      // Start waiting for the download
      page.waitForEvent("download"),
      // Perform the action that initiates download
      page.locator('[aria-label="Download todo.txt"]').click(),
    ]);
    // Wait for the download process to complete
    await download.path();
    expect(download.suggestedFilename()).toBe("todo.txt");
  });

  test("should download todo.txt and done.txt", async ({ page }) => {
    // activate archiving
    await page.keyboard.press("m");
    await page.locator('[role="tab"][aria-label="Settings"]').click();
    await page.locator('[aria-label="Select archive mode"]').click();
    await page.locator('[data-value="automatic"]').click();
    await page.keyboard.press("Escape");

    const [download] = await Promise.all([
      // Start waiting for the download
      page.waitForEvent("download"),
      // Perform the action that initiates download
      page.locator('[aria-label="Download todo.txt"]').click(),
    ]);
    // Wait for the download process to complete
    await download.path();
    const filename = download.suggestedFilename();
    expect(/todo_.*.zip/.test(filename)).toBe(true);
  });
});
