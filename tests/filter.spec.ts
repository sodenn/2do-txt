import { expect, test } from "@playwright/test";
import {
  checkSearchParams,
  createExampleFile,
  goto,
  toggleMenu,
} from "./playwright-utils";

const withoutFile = [
  "should not show the search bar when no files are open",
  "should not show the search field if no todo.txt files are open",
];

test.beforeEach(async ({ page }, testInfo) => {
  await goto(page);
  if (!withoutFile.includes(testInfo.title)) {
    await createExampleFile(page);
  }
});

test.describe("Search", () => {
  test("should not show the search field if no todo.txt files are open", async ({
    page,
  }) => {
    await expect(
      page.getByRole("search", { name: "Search for tasks" }),
    ).not.toBeVisible();
  });

  test("should filter tasks by using the search", async ({
    page,
    isMobile,
  }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    if (isMobile) {
      await page.getByRole("button", { name: "Expand search bar" }).click();
      await Promise.all([
        checkSearchParams(page, "/?term=invoice"),
        page.getByRole("search", { name: "Search for tasks" }).fill("invoice"),
      ]);
    } else {
      await Promise.all([
        checkSearchParams(page, "/?term=invoice"),
        page.getByRole("search", { name: "Search for tasks" }).fill("invoice"),
      ]);
    }
    await expect(page.getByTestId("task")).toHaveCount(1);
  });

  test("should start searching by using a keyboard shortcut", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    await page.setViewportSize({ width: 800, height: 1080 });
    await expect(
      page.getByRole("search", { name: "Search for tasks" }),
    ).not.toBeFocused();
    await page.keyboard.press("f");
    await expect(
      page.getByRole("search", { name: "Search for tasks" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("search", { name: "Search for tasks" }),
    ).not.toBeFocused();
  });

  test("should clear the search when clicking on the clear button", async ({
    page,
    isMobile,
  }) => {
    if (isMobile) {
      await page.getByRole("button", { name: "Expand search bar" }).click();
    }
    await page
      .getByRole("search", { name: "Search for tasks" })
      .fill("invoice");
    await expect(
      page.getByRole("search", { name: "Search for tasks" }),
    ).not.toBeEmpty();
    await page.getByRole("search", { name: "Search for tasks" }).fill("");
    await expect(
      page.getByRole("search", { name: "Search for tasks" }),
    ).toBeEmpty();
    await expect(page.getByTestId("task")).toHaveCount(8);
  });

  test("should display a message if no tasks was found", async ({
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
  test("should filter tasks by priority", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await toggleMenu(page);
    await page.getByLabel("A", { exact: true }).click();
    await checkSearchParams(page, "/?priorities=A");
    await expect(page.getByTestId("task")).toHaveCount(2);
    await page.getByLabel("A", { exact: true }).click();
    await checkSearchParams(page, "");
  });

  test("should filter tasks by project", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await toggleMenu(page);
    await page.getByLabel("CompanyA", { exact: true }).click();
    await checkSearchParams(page, "/?projects=CompanyA");
    await expect(page.getByTestId("task")).toHaveCount(1);
    await page.getByLabel("CompanyA", { exact: true }).click();
    await checkSearchParams(page, "");
  });

  test("should filter tasks by context", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await toggleMenu(page);
    await page.getByLabel("Private", { exact: true }).click();
    await checkSearchParams(page, "/?contexts=Private");
    await expect(page.getByTestId("task")).toHaveCount(4);
    await page.getByLabel("Private", { exact: true }).click();
    await checkSearchParams(page, "");
  });

  test("should hide completed tasks", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await toggleMenu(page);
    await expect(page.getByLabel("Holiday", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Hide completed tasks" }).click();
    await expect(page.getByLabel("Holiday", { exact: true })).toBeVisible();
    await expect(page.getByTestId("task")).toHaveCount(6);
  });

  test("should sort tasks by priority", async ({ page }) => {
    await toggleMenu(page);
    await page.locator('[aria-label="Sort tasks"]').click();
    await page.locator('text="Priority"').click();
    await expect(
      page.locator('[aria-label="Task group"] >> text="A"'),
    ).toHaveCount(1);
    await expect(
      page.locator('[aria-label="Task group"] >> text="B"'),
    ).toHaveCount(1);
    await expect(
      page.locator('[aria-label="Task group"] >> text="Without priority"'),
    ).toHaveCount(1);
  });

  test("should clear active filter by using a keyboard shortcut", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");
    await toggleMenu(page);
    await page.getByLabel("Private", { exact: true }).click();
    await page.getByLabel("CompanyA", { exact: true }).click();
    await page.keyboard.press("x");
    await checkSearchParams(page, "");
  });

  test("should clear active filter by clicking on the clear button", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");
    await toggleMenu(page);
    await expect(page.getByText("Reset filters")).not.toBeVisible();
    await page.getByLabel("Private", { exact: true }).click();
    await page.getByLabel("CompanyA", { exact: true }).click();
    await expect(page.getByText("Reset filters")).toBeVisible();
    await page.getByText("Reset filters").click();
    await expect(page.getByText("Reset filters")).not.toBeVisible();
    await checkSearchParams(page, "");
  });
});

test.describe("Menu", () => {
  test("should toggle the side menu by using a keyboard shortcut", async ({
    page,
    isMobile,
  }) => {
    await page.keyboard.press("m");
    await expect(page.getByLabel("Side Menu")).toBeVisible();
    await page.keyboard.press("m");
    if (isMobile) {
      await expect(page.getByLabel("Side Menu")).not.toBeVisible();
    } else {
      await expect(page.getByLabel("Side Menu")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });
});
