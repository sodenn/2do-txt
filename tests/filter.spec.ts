import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.setInputFiles("input#file-picker", "resources/todo.txt");
});

test.describe("Search", () => {
  test("should allow me to search for tasks", async ({ page }) => {
    await expect(page.locator("[aria-label='Task']")).toHaveCount(8);

    await Promise.all([
      page.waitForNavigation({ url: "http://localhost:3000/?term=invoice" }),
      page.locator('input[placeholder="Search…"]').fill("invoice"),
    ]);

    await expect(page.locator("[aria-label='Task']")).toHaveCount(1);
  });

  test("should allow me to use a shortcut to start searching", async ({
    page,
  }) => {
    await expect(
      page.locator('input[placeholder="Search…"]')
    ).not.toBeFocused();
    await page.keyboard.press("f");
    await expect(page.locator('input[placeholder="Search…"]')).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(
      page.locator('input[placeholder="Search…"]')
    ).not.toBeFocused();
    await page.keyboard.press("f");
  });

  test("should allow me to clear the search input field", async ({ page }) => {
    await page.locator('input[placeholder="Search…"]').fill("invoice");
    await expect(page.locator('input[placeholder="Search…"]')).not.toBeEmpty();
    await page.locator('button[aria-label="Clear search term"]').click();
    await expect(page.locator('input[placeholder="Search…"]')).toBeEmpty();
    await expect(page.locator("[aria-label='Task']")).toHaveCount(8);
  });

  test("should show info text if no tasks was found", async ({ page }) => {
    await page.locator('input[placeholder="Search…"]').fill("---");
    await expect(page.locator("text=No tasks")).toBeVisible();
  });
});

test.describe("Priority", () => {
  test("should allow me to filter tasks by priority", async ({ page }) => {
    await expect(page.locator("[aria-label='Task']")).toHaveCount(8);
    await page.keyboard.press("m");
    await page.locator('[aria-label="A is used 2 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000/?priorities=A");
    await expect(page.locator("[aria-label='Task']")).toHaveCount(2);
    await page.locator('[aria-label="A is used 2 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000");
  });
});

test.describe("Project", () => {
  test("should allow me to filter tasks by project", async ({ page }) => {
    await expect(page.locator("[aria-label='Task']")).toHaveCount(8);
    await page.keyboard.press("m");
    await page.locator('[aria-label="CompanyA is used 1 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000/?projects=CompanyA");
    await expect(page.locator("[aria-label='Task']")).toHaveCount(1);
    await page.locator('[aria-label="CompanyA is used 1 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000");
  });
});

test.describe("Context", () => {
  test("should allow me to filter tasks by context", async ({ page }) => {
    await expect(page.locator("[aria-label='Task']")).toHaveCount(8);
    await page.keyboard.press("m");
    await page.locator('[aria-label="Private is used 4 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000/?contexts=Private");
    await expect(page.locator("[aria-label='Task']")).toHaveCount(4);
    await page.locator('[aria-label="Private is used 4 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000");
  });
});

test.describe("Status", () => {
  test("should allow me to hide completed tasks", async ({ page }) => {
    await expect(page.locator("[aria-label='Task']")).toHaveCount(8);
    await page.keyboard.press("m");
    await expect(
      page.locator('[aria-label="Holiday is used 2 times"]')
    ).toBeVisible();
    await page.locator('[aria-label="Hide completed tasks"]').check();
    await expect(
      page.locator('[aria-label="Holiday is used 1 times"]')
    ).toBeVisible();
    await expect(page.locator("[aria-label='Task']")).toHaveCount(6);
  });
});

test.describe("Sorting", () => {
  test("should allow me to sort tasks by priority", async ({ page }) => {
    await page.keyboard.press("m");
    await page.locator('[aria-label="Sort tasks"]').click();
    await page.locator('text="Priority"').click();
    await expect(
      page.locator('[aria-label="Task group"] >> text="A"')
    ).toHaveCount(1);
    await expect(
      page.locator('[aria-label="Task group"] >> text="B"')
    ).toHaveCount(1);
    await expect(
      page.locator('[aria-label="Task group"] >> text="Without priority"')
    ).toHaveCount(1);
  });
});

test.describe("Menu", () => {
  test("should allow me to close the menu via Escape key", async ({ page }) => {
    await page.keyboard.press("m");
    await expect(
      page.locator("[role='presentation'][aria-label='Menu']")
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.locator("[role='presentation'][aria-label='Menu']")
    ).not.toBeVisible();
  });
});
