import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await page.getByRole("tab", { name: "Settings" }).click();
});

test.describe("Archiving", () => {
  test("should archive tasks automatically", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive automatically").click();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should archive tasks manually", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive manually").click();
    await page.getByLabel("Archive now").click();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should restore archived tasks", async ({ page }) => {
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("Archive automatically").click();
    await expect(page.getByTestId("task")).toHaveCount(6);
    await page.getByLabel("Select archive mode").click();
    await page.getByLabel("No archiving").click();
    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});
