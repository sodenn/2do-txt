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
    await checkInLocalStorage(page, "theme-mode", "system");
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
    await checkInLocalStorage(page, "theme-mode", "light");

    await page.locator('[aria-label="Select theme mode"]').click();
    await page.locator("text=Dark").click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#0a1726"
    );
    await checkInLocalStorage(page, "theme-mode", "dark");
  });
});

test.describe("Language", () => {
  test("should allow me to switch between english and german language", async ({
    page,
  }) => {
    // select English
    await page.locator('[aria-label="Select language"]').click();
    await page.locator('[role="option"] >> text=English').click();
    await expect(
      page.locator('[aria-label="Select language"] >> [role="button"]')
    ).toHaveText("English");
    await expect(page.locator("text=Language").first()).toBeVisible();
    await checkInLocalStorage(page, "language", "en");

    // select German
    await page.locator('[aria-label="Select language"]').click();
    await page.locator('[role="option"] >> text=German').click();
    await expect(
      page.locator('[aria-label="Select language"] >> [role="button"]')
    ).toHaveText("Deutsch");
    await expect(page.locator("text=Sprache").first()).toBeVisible();
    await checkInLocalStorage(page, "language", "de");
  });
});

async function checkInLocalStorage(page: Page, key: string, value: string) {
  const arg = JSON.stringify({ key, value });
  return await page.evaluate((_arg) => {
    const arg = JSON.parse(_arg);
    return localStorage[`CapacitorStorage.${arg.key}`] === arg.value;
  }, arg);
}
