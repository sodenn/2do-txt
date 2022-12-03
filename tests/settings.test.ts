import { expect, Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Toggle menu" }).click();
});

test.describe("Appearance", () => {
  test("should use the system setting as the default theme mode", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Select theme mode" })
    ).toContainText("System");
    await checkInLocalStorage(page, "theme-mode", "system");
  });

  test("should allow me to switch between light mode to dark mode", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Select theme mode" }).click();
    await page.getByRole("option", { name: "Light" }).click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#fff"
    );
    await checkInLocalStorage(page, "theme-mode", "light");

    await page.getByRole("button", { name: "Select theme mode" }).click();
    await page.getByRole("option", { name: "Dark" }).click();
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
    await page.getByRole("button", { name: "Select language" }).click();
    await page.getByRole("option", { name: "English" }).click();
    await expect(
      page.getByRole("button", { name: "Select language" })
    ).toHaveText("English");
    await expect(page.locator("text=Language").first()).toBeVisible();

    // select German
    await page.getByRole("button", { name: "Select language" }).click();
    await page.getByRole("option", { name: "German" }).click();
    await expect(
      page.getByRole("button", { name: "Select language" })
    ).toHaveText("Deutsch");
    await expect(page.locator("text=Sprache").first()).toBeVisible();
    await checkInLocalStorage(page, "language", "de");
  });
});

async function checkInLocalStorage(page: Page, key: string, value: string) {
  const arg = JSON.stringify({ key, value });
  const result = await page.evaluate((_arg) => {
    const arg = JSON.parse(_arg);
    return localStorage[`CapacitorStorage.${arg.key}`] === arg.value;
  }, arg);
  expect(result).toBe(true);
}
