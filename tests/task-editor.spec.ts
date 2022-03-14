import { expect, test } from "@playwright/test";
import { format } from "date-fns";
import { formatDate } from "../src/utils/date";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.setInputFiles("input#file-picker", "resources/todo.txt");
});

test.describe("Task editor", () => {
  test("should allow me to add a task with contexts", async ({ page }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await expect(page.locator('[aria-label="Text editor"]')).toBeFocused();

    await page.type('[aria-label="Text editor"]', "Play soccer with friends @");

    await page.locator('[role="option"] >> text="Private"').click();

    await page.type('[aria-label="Text editor"]', "@");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      "Play soccer with friends @Private @Holiday"
    );
  });

  test("should allow me to add a task with a due date", async ({
    page,
    isMobile,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await expect(page.locator('[aria-label="Text editor"]')).toBeFocused();

    if (isMobile) {
      await page.locator('[aria-label="Due date"]').click();
    } else {
      await page
        .locator('[aria-label="Choose date"]:right-of([aria-label="Due date"])')
        .click();
    }

    const today = new Date();
    const selector = `[aria-label="${format(today, "MMM dd, yyyy")}"]`;
    const dueDateTag = `due:${formatDate(today)}`;

    await page.locator(selector).click();
    if (isMobile) {
      await page.locator("button >> text=OK").click();
    }

    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      dueDateTag
    );

    await page.locator('[aria-label="Text editor"]').click();
    await page.keyboard.press("End");
    await page.press('[aria-label="Text editor"]', "Backspace");
    await page.press('[aria-label="Text editor"]', "Backspace");

    await expect(page.locator('[aria-label="Text editor"]')).toHaveText("");
  });

  test("should allow me to edit a task", async ({ page }) => {
    await page.locator("text=Pay the invoice").click();

    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      "Pay the invoice +CompanyB @Work due:2021-12-15"
    );

    await expect(page.locator('input[aria-label="Creation date"]')).toHaveValue(
      "11/26/2021"
    );

    await expect(page.locator('input[aria-label="Due date"]')).toHaveValue(
      "12/15/2021"
    );

    await expect(
      page.locator('[aria-label="Select task priority"]')
    ).toHaveText("A");
  });

  test("should continue selecting the mention after blur from input", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "blur not working correctly");

    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @pr"
    );

    await expect(page.locator('[role="option"] >> text=Add pr')).toHaveCount(1);

    await expect(page.locator('[role="option"] >> text="Private"')).toHaveCount(
      1
    );

    await page.locator('[aria-label="Text editor"]').evaluate((e) => e.blur());

    await expect(page.locator('[role="option"] >> text=Add pr')).toHaveCount(0);

    await expect(page.locator('[role="option"] >> text="Private"')).toHaveCount(
      0
    );

    await page.locator('[aria-label="Text editor"]').click();

    await expect(page.locator('[role="option"] >> text=Add pr')).toHaveCount(1);

    await expect(page.locator('[role="option"] >> text="Private"')).toHaveCount(
      1
    );
  });

  test("should allow me to add new mentions via space bar", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @pr "
    );

    await expect(page.locator('[data-testid="mentionText"]')).toHaveText("@pr");
  });

  test("should no longer show the suggestion to create a new mention once a mention has been fully entered", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @Private"
    );

    await expect(
      page.locator('[role="option"] >> text=Add Private')
    ).toHaveCount(0);

    await expect(page.locator('[role="option"] >> text="Private"')).toHaveCount(
      1
    );
  });

  test("should respect case when adding new mentions", async ({ page }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @private"
    );

    await expect(
      page.locator('[role="option"] >> text=Add private')
    ).toHaveCount(1);

    await expect(page.locator('[role="option"] >> text="Private"')).toHaveCount(
      1
    );
  });
});
