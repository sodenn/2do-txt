import { expect, test } from "@playwright/test";
import { createExampleFile, goto, openSettings } from "./playwright-utils";

test.beforeEach(async ({ page }) => {
  await goto(page);
  await createExampleFile(page);
  await openSettings(page);
});

test.describe("Archiving", () => {
  test("should archive tasks automatically", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive automatically").click();
    await page.getByLabel("Create list").click();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should archive tasks manually", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive manually").click();
    await page.getByLabel("Archive now").click();
    await page.getByLabel("Create list").click();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should restore archived tasks", async ({ page }) => {
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive automatically").click();
    await page.getByLabel("Create list").click();
    await expect(page.getByTestId("task")).toHaveCount(6);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("No archiving").click();
    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});
