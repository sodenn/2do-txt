import { expect, test } from "@playwright/test";
import { format } from "date-fns";
import { formatDate } from "../src/utils/date";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.setInputFiles('[data-testid="file-picker"]', "resources/todo.txt");
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
    const selector = `[aria-label="${format(today, "MMM d, yyyy")}"]`;
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
    // select existing task in the list
    await page.locator("text=Pay the invoice").click();

    // make sure the task text is set
    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      "Pay the invoice +CompanyB @Work due:2021-12-15"
    );

    // make sure the creation date is set
    await expect(page.locator('input[aria-label="Creation date"]')).toHaveValue(
      "11/26/2021"
    );

    // make sure the due date is set
    await expect(page.locator('input[aria-label="Due date"]')).toHaveValue(
      "12/15/2021"
    );

    // make sure priority is set
    await expect(
      page.locator('[aria-label="Select task priority"]')
    ).toHaveValue("A");
  });

  test("should continue selecting a context after blur from input", async ({
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

  test("should allow me to add new contexts via space bar", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @pr "
    );

    // make sure context was added
    await expect(page.locator('[data-testid="mentionText"]')).toHaveText("@pr");

    // make sure there is no open dropdown menu with suggestions
    await expect(page.locator(".mentionSuggestions")).toHaveCount(0);
  });

  test("should add new contexts when cursor position changed", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @pr"
    );

    await page.keyboard.press("ArrowLeft");

    // make sure context was added
    await expect(page.locator('[data-testid="mentionText"]')).toHaveText("@pr");

    // make sure there is no open dropdown menu with suggestions
    await expect(page.locator(".mentionSuggestions")).toHaveCount(0);
  });

  test("should no longer show the option to create a new context when the context already exist", async ({
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

  test("should respect upper case and lower case when adding new contexts", async ({
    page,
  }) => {
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

  test("should suggest newly added contexts", async ({ page }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @Hobby"
    );

    await page.keyboard.press("Enter");

    await page.type('[aria-label="Text editor"]', " @");

    await expect(page.locator('[role="option"] >> text="Hobby"')).toHaveCount(
      1
    );
  });

  test("should allow me to create a new task by keyboard only", async ({
    page,
    isMobile,
  }) => {
    // eslint-disable-next-line jest/valid-title
    test.skip(!!isMobile, "not relevant for mobile browsers");

    await page.locator('button[aria-label="Add task"]').click();

    // type task description
    await page.type('[aria-label="Text editor"]', "Play soccer with friends");

    // navigate to priority input
    await page.keyboard.press("Tab");

    // select priority
    await page.keyboard.press("A");

    // make sure priority was selected
    await expect(
      page.locator('[aria-label="Select task priority"]')
    ).toHaveValue("A");

    // navigate to due date input
    await page.keyboard.press("Tab");

    // navigate to date picker button
    await page.keyboard.press("Tab");

    // open the date picker
    await page.keyboard.press("Enter");

    // apply due date selection
    await page.keyboard.press("Enter");

    // make sure due date was selected
    await expect(page.locator('[aria-label="Due date"]')).toHaveValue(
      format(new Date(), "MM/dd/yyyy")
    );

    // navigate to save button
    await page.keyboard.press("Tab");
  });
});
