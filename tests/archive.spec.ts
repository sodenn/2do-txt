import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await page.getByRole("tab", { name: "Settings" }).click();
});

test.describe("Archiving", () => {
  test("should allow me archive tasks automatically", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByRole("combobox", { name: "Select archive mode" }).click();
    await page.getByRole("option", { name: "Archive automatically" }).click();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should allow me archive tasks manually", async ({ page }) => {
    await page.getByRole("combobox", { name: "Select archive mode" }).click();
    await page.getByRole("option", { name: "Archive manually" }).click();
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByRole("button", { name: "Archive now" }).click();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should allow me to restore archived tasks", async ({ page }) => {
    await page.getByRole("combobox", { name: "Select archive mode" }).click();
    await page.getByRole("option", { name: "Archive automatically" }).click();
    await expect(page.getByTestId("task")).toHaveCount(6);
    await page.getByRole("combobox", { name: "Select archive mode" }).click();
    await page.getByRole("option", { name: "No archiving" }).click();
    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});
