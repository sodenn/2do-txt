import { expect, Page, test } from "@playwright/test";
import { goto, toggleMenu } from "./playwright-utils";

test.beforeEach(async ({ page }) => {
  await goto(page);
  await toggleMenu(page);
});

test.describe("Appearance", () => {
  test("should use the system setting as the default theme mode", async ({
    page,
  }) => {
    await expect(page.getByLabel("Select theme mode")).toContainText("System");
    await checkInLocalStorage(page, "theme-mode", "system");
  });

  test("should switch between light mode to dark mode", async ({ page }) => {
    await page.getByLabel("Select theme mode").click();
    await page.getByLabel("Light").click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#f9fbfd",
    );
    await checkInLocalStorage(page, "theme-mode", "light");

    await page.getByLabel("Select theme mode").click();
    await page.getByLabel("Dark").click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#101823",
    );
    await checkInLocalStorage(page, "theme-mode", "dark");
  });
});

test.describe("Language", () => {
  test("should switch between english and german language", async ({
    page,
  }) => {
    // select English
    await page.getByLabel("Select language").click();
    await page.getByLabel("English").click();
    await expect(page.getByLabel("Select language")).toHaveText("English");
    await expect(page.locator("text=Language").first()).toBeVisible();

    // select German
    await page.getByLabel("Select language").click();
    await page.getByLabel("German").click();
    await expect(page.getByLabel("Select language")).toHaveText("Deutsch");
    await expect(page.locator("text=Sprache").first()).toBeVisible();
    await checkInLocalStorage(page, "language", "de");
  });
});

async function checkInLocalStorage(page: Page, key: string, value: string) {
  const arg = JSON.stringify({ key, value });
  const result = await page.evaluate((_arg) => {
    const arg = JSON.parse(_arg);
    return localStorage[arg.key] === arg.value;
  }, arg);
  expect(result).toBe(true);
}
