import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await page.waitForTimeout(100);
});

test.describe("Download", () => {
  test("should download a todo.txt file", async ({ page }) => {
    await page.getByLabel("File menu").click();
    await page.getByRole("menuitem", { name: "Files…" }).click();
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
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive automatically").click();
    await page.keyboard.press("Escape");

    await page.getByLabel("File menu").click();
    await page.getByRole("menuitem", { name: "Files…" }).click();
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
