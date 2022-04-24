import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.setInputFiles('[data-testid="file-picker"]', "resources/todo.txt");
});

test.describe("Search", () => {
  test("should allow me to search for tasks", async ({ page, isMobile }) => {
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);

    if (isMobile) {
      await page.locator('[aria-label="Expand search bar"]').click();
      await Promise.all([
        page.waitForNavigation({ url: "http://localhost:3000/?term=invoice" }),
        page.locator('[aria-label="Search for tasks"]').nth(1).fill("invoice"),
      ]);
    } else {
      await Promise.all([
        page.waitForNavigation({ url: "http://localhost:3000/?term=invoice" }),
        page.locator('[aria-label="Search for tasks"]').fill("invoice"),
      ]);
    }

    await expect(page.locator('[aria-label="Task"]')).toHaveCount(1);
  });

  test("should allow me to use a shortcut to start searching", async ({
    page,
    isMobile,
  }) => {
    // eslint-disable-next-line jest/valid-title
    test.skip(!!isMobile, "desktop only");

    await expect(
      page.locator('[aria-label="Search for tasks"]')
    ).not.toBeFocused();

    await page.keyboard.press("f");

    await expect(page.locator('[aria-label="Search for tasks"]')).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(
      page.locator('[aria-label="Search for tasks"]')
    ).not.toBeFocused();
  });

  test("should allow me to clear the search input field", async ({
    page,
    isMobile,
  }) => {
    // eslint-disable-next-line jest/valid-title
    test.skip(!!isMobile, "desktop only");

    await page.locator('[aria-label="Search for tasks"]').fill("invoice");

    await expect(
      page.locator('[aria-label="Search for tasks"]')
    ).not.toBeEmpty();

    await page.locator('button[aria-label="Clear search term"]').click();

    await expect(page.locator('[aria-label="Search for tasks"]')).toBeEmpty();
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
  });

  test("should allow me to clear the search input field (mobile)", async ({
    page,
    isMobile,
  }) => {
    // eslint-disable-next-line jest/valid-title
    test.skip(!isMobile, "mobile only");

    await page.locator('[aria-label="Expand search bar"]').click();
    await page
      .locator('[aria-label="Search for tasks"]')
      .nth(1)
      .fill("invoice");

    await expect(
      page.locator('[aria-label="Search for tasks"]').nth(1)
    ).not.toBeEmpty();

    await page.locator('button[aria-label="Clear search term"]').nth(1).click();
    await expect(
      page.locator('[aria-label="Search for tasks"]').nth(1)
    ).toBeEmpty();
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
  });

  test("should show info text if no tasks was found", async ({
    page,
    isMobile,
  }) => {
    if (isMobile) {
      await page.locator("[aria-label='Expand search bar']").click();
      await page.locator('[aria-label="Search for tasks"]').nth(1).fill("---");
    } else {
      await page.locator('[aria-label="Search for tasks"]').fill("---");
    }
    await expect(page.locator("text=No tasks")).toBeVisible();
  });
});

test.describe("Priority", () => {
  test("should allow me to filter tasks by priority", async ({ page }) => {
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
    await page.keyboard.press("m");
    await page.locator('[aria-label="A is used 2 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000/?priorities=A");
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(2);
    await page.locator('[aria-label="A is used 2 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000");
  });
});

test.describe("Project", () => {
  test("should allow me to filter tasks by project", async ({ page }) => {
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
    await page.keyboard.press("m");
    await page.locator('[aria-label="CompanyA is used 1 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000/?projects=CompanyA");
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(1);
    await page.locator('[aria-label="CompanyA is used 1 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000");
  });
});

test.describe("Context", () => {
  test("should allow me to filter tasks by context", async ({ page }) => {
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
    await page.keyboard.press("m");
    await page.locator('[aria-label="Private is used 4 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000/?contexts=Private");
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(4);
    await page.locator('[aria-label="Private is used 4 times"]').click();
    await expect(page).toHaveURL("http://localhost:3000");
  });
});

test.describe("Status", () => {
  test("should allow me to hide completed tasks", async ({ page }) => {
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
    await page.keyboard.press("m");
    await expect(
      page.locator('[aria-label="Holiday is used 2 times"]')
    ).toBeVisible();
    await page.locator('[aria-label="Hide completed tasks"]').click();
    await expect(
      page.locator('[aria-label="Holiday is used 1 times"]')
    ).toBeVisible();
    await expect(page.locator('[aria-label="Task"]')).toHaveCount(6);
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
  test("should allow me to toggle the menu via shortcut", async ({
    page,
    isMobile,
  }) => {
    // eslint-disable-next-line jest/valid-title
    await page.keyboard.press("m");
    await expect(page.locator('[aria-label="Open menu"]')).toBeVisible();
    await page.keyboard.press("m");
    await expect(page.locator('[aria-label="Closed menu"]')).toBeVisible();
  });
});
