import { expect, test } from "@playwright/test";
import { createExampleFile, goto } from "./playwright-utils";

test.beforeEach(async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await goto(page);
  await createExampleFile(page);
});

test.describe("Keyboard shortcuts", () => {
  test("should not trigger keyboard shortcuts when input is focused", async ({
    page,
  }) => {
    await page.getByRole("search", { name: "Search for tasks" }).focus();
    await page.keyboard.press("m"); // m = keyboard shortcuts for opening the menu
    await page.waitForTimeout(200);
    await expect(page.getByLabel("Side Menu")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await page.keyboard.press("ArrowDown"); // ArrowDown = keyboard shortcuts for selecting a task
    await page.waitForTimeout(200);
    await expect(page.getByTestId("task").first()).not.toBeFocused();
  });

  test("should not trigger keyboard shortcuts when menu is open", async ({
    page,
  }) => {
    await page.getByLabel("File menu").click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await expect(page.getByTestId("task").first()).not.toBeFocused();
  });

  test("should not trigger keyboard shortcuts when select is open", async ({
    page,
  }) => {
    await page.keyboard.press("m");
    await page.waitForTimeout(200);
    await page.getByLabel("Filter type").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await expect(page.getByTestId("task").first()).not.toBeFocused();
  });

  test("should not trigger keyboard shortcuts when backdrop is open", async ({
    page,
  }) => {
    await page.keyboard.press("n");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await expect(page.getByTestId("task").first()).not.toBeFocused();
  });
});
