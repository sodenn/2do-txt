import { expect, test } from "@playwright/test";

const withoutFile = ["should not show the search bar when no files are open"];

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5173");
  if (!withoutFile.includes(testInfo.title)) {
    await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  }
});

test.describe("Search", () => {
  test("should not show the search bar when no files are open", async ({
    page,
  }) => {
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).not.toBeVisible();
  });

  test("should allow me to search for tasks", async ({ page, isMobile }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    if (isMobile) {
      await page.getByRole("button", { name: "Expand search bar" }).click();
      await Promise.all([
        page.waitForNavigation({ url: "http://127.0.0.1:5173/?term=invoice" }),
        page.getByRole("search", { name: "Search for tasks" }).fill("invoice"),
      ]);
    } else {
      await Promise.all([
        page.waitForNavigation({ url: "http://127.0.0.1:5173/?term=invoice" }),
        page.getByRole("search", { name: "Search for tasks" }).fill("invoice"),
      ]);
    }
    await expect(page.getByTestId("task")).toHaveCount(1);
  });

  test("should allow me to use a shortcut to start searching", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).not.toBeFocused();
    await page.keyboard.press("f");
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).not.toBeFocused();
  });

  test("should allow me to clear the search input field", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    await page
      .getByRole("search", { name: "Search for tasks" })
      .fill("invoice");
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).not.toBeEmpty();
    await page.getByRole("button", { name: "Clear search term" }).click();
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).toBeEmpty();
    await expect(page.getByTestId("task")).toHaveCount(8);
  });

  test("mobile: should allow me to clear the search input field", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile only");
    await page.getByRole("button", { name: "Expand search bar" }).click();
    await page
      .getByRole("search", { name: "Search for tasks" })
      .fill("invoice");
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).not.toBeEmpty();
    await page.getByRole("button", { name: "Clear search term" }).click();
    await expect(
      page.getByRole("search", { name: "Search for tasks" })
    ).toBeEmpty();
    await expect(page.getByTestId("task")).toHaveCount(8);
  });

  test("should show info text if no tasks was found", async ({
    page,
    isMobile,
  }) => {
    if (isMobile) {
      await page.getByRole("button", { name: "Expand search bar" }).click();
      await page.getByRole("search", { name: "Search for tasks" }).fill("---");
    } else {
      await page.getByRole("search", { name: "Search for tasks" }).fill("---");
    }
    await expect(page.locator("text=No tasks")).toBeVisible();
  });
});

test.describe("Filter", () => {
  test("should allow me to filter tasks by priority", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("button", { name: "A is used 2 times" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:5173/?priorities=A");
    await expect(page.getByTestId("task")).toHaveCount(2);
    await page.getByRole("button", { name: "A is used 2 times" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:5173");
  });

  test("should allow me to filter tasks by project", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page
      .getByRole("button", { name: "CompanyA is used 1 times" })
      .click();
    await expect(page).toHaveURL("http://127.0.0.1:5173/?projects=CompanyA");
    await expect(page.getByTestId("task")).toHaveCount(1);
    await page
      .getByRole("button", { name: "CompanyA is used 1 times" })
      .click();
    await expect(page).toHaveURL("http://127.0.0.1:5173");
  });

  test("should allow me to filter tasks by context", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("button", { name: "Private is used 4 times" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:5173/?contexts=Private");
    await expect(page.getByTestId("task")).toHaveCount(4);
    await page.getByRole("button", { name: "Private is used 4 times" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:5173");
  });

  test("should allow me to hide completed tasks", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await expect(
      page.getByRole("button", { name: "Holiday is used 2 times" })
    ).toBeVisible();
    await page.getByRole("checkbox", { name: "Hide completed tasks" }).click();
    await expect(
      page.getByRole("button", { name: "Holiday is used 1 times" })
    ).toBeVisible();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should allow me to sort tasks by priority", async ({ page }) => {
    await page.getByRole("button", { name: "Toggle menu" }).click();
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

  test("should clear active filter by shortcut", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("button", { name: "Private is used 4 times" }).click();
    await page
      .getByRole("button", { name: "CompanyA is used 1 times" })
      .click();
    await page.keyboard.press("x");
    await expect(page).toHaveURL("http://127.0.0.1:5173");
  });
});

test.describe("Menu", () => {
  test("should allow me to toggle the menu via shortcut", async ({ page }) => {
    await page.keyboard.press("m");
    await expect(page.locator('[aria-label="Open menu"]')).toBeVisible();
    await page.keyboard.press("m");
    await expect(page.locator('[aria-label="Closed menu"]')).toBeVisible();
  });
});
