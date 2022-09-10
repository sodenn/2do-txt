import { expect, Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
  await page.locator('[aria-label="Toggle menu"]').click();
});

test.describe("Appearance", () => {
  test("should use the system setting as the default theme mode", async ({
    page,
  }) => {
    await expect(
      page.locator('[aria-label="Select theme mode"]')
    ).toContainText("System");
    await checkThemeInLocalStorage(page, "system");
  });

  test("should allow me to switch between light mode to dark mode", async ({
    page,
  }) => {
    await page.locator('[aria-label="Select theme mode"]').click();
    await page.locator("text=Light").click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#fff"
    );
    await checkThemeInLocalStorage(page, "light");

    await page.locator('[aria-label="Select theme mode"]').click();
    await page.locator("text=Dark").click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#0a1726"
    );
    await checkThemeInLocalStorage(page, "dark");
  });
});

test.describe("Language", () => {
  test("should allow me to switch between english and german language", async ({
    page,
  }) => {
    await page.locator('[aria-label="Select language"]').click();
    await page.locator('[role="option"] >> text=English').click();
    await expect(
      page.locator('[aria-label="Select language"] >> [role="button"]')
    ).toHaveText("English");

    await page.locator('[aria-label="Select language"]').click();
    await page.locator('[role="option"] >> text=German').click();
    await expect(
      page.locator('[aria-label="Select language"] >> [role="button"]')
    ).toHaveText("Deutsch");
    await checkLanguageInLocalStorage(page, "de");
  });
});

test.describe("Dates", () => {});

async function checkThemeInLocalStorage(page: Page, theme: string) {
  return await page.waitForFunction((val) => {
    return localStorage["CapacitorStorage.theme-mode"] === val;
  }, theme);
}

async function checkLanguageInLocalStorage(page: Page, theme: string) {
  return await page.waitForFunction((val) => {
    return localStorage["CapacitorStorage.language"] === val;
  }, theme);
}
