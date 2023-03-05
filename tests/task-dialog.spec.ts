import { expect, Page, test } from "@playwright/test";
import { format } from "date-fns";
import { formatDate } from "../src/utils/date";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
});

const delay = { delay: 40 };

async function expectDateValue(page: Page, label: string, expected: string) {
  const inputValue = await page
    .locator(`input[data-testid="${label}"]`)
    .inputValue();
  const date = inputValue.replace(/[\u2069\u2066\s⁨]/g, "");
  expect(date).toBe(expected);
}

test.describe("Task dialog", () => {
  test("should allow me to open and close the task dialog via shortcut", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");
    await page.waitForTimeout(1000);
    await page.keyboard.press("n");
    await expect(page.getByTestId("task-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("task-dialog")).not.toBeVisible();
  });

  test("should allow me to add a task with contexts", async ({ page }) => {
    await page.getByRole("button", { name: "Add task" }).click();

    await expect(
      page.getByRole("textbox", { name: "Text editor" })
    ).toBeFocused();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @",
      delay
    );

    // select "Private" from the mention list
    await page.locator('[role="menuitem"] >> text="Private"').click(delay);

    // open the mention popover
    await page.type('[aria-label="Text editor"]', "@", delay);
    // select "Holiday" from the mention list
    await page.keyboard.press("ArrowDown", delay);
    await page.keyboard.press("Enter", delay);

    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      "Play soccer with friends @Private @Holiday"
    );

    // save the task
    await page.getByRole("button", { name: "Save task" }).click();

    // make sure the task is part of the list
    await expect(
      page.locator(
        '[data-testid="task"] >> text=Play soccer with friends @Private @Holiday'
      )
    ).toBeVisible();
  });

  test("should keep due date datepicker and text field in sync", async ({
    page,
    isMobile,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await expect(page.locator('[aria-label="Text editor"]')).toBeFocused();

    // open the date picker
    const datePickerButton = isMobile
      ? '[data-testid="Due date"]'
      : '[aria-label*="Choose date"]';
    await page.locator(datePickerButton).click();

    const today = new Date();
    const dueDateSelector = '[aria-current="date"]';
    const dueDateTag = `due:${formatDate(today)}`;

    // choose date and confirm
    await page.locator(dueDateSelector).click();
    if (isMobile) {
      await page.locator("button >> text=OK").click();
    }

    // make sure the date picker contain a value
    await expectDateValue(page, "Due date", format(today, "MM/dd/yyyy"));

    // make sure the text field contains the due date
    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      dueDateTag
    );

    // remove the due date from the text field
    await page.locator('[aria-label="Text editor"]').click();
    await page.keyboard.press("End");
    await page.press('[aria-label="Text editor"]', "Backspace");

    // make sure the date picker doesn't contain a value
    await expectDateValue(page, "Due date", "");

    // make sure the text field doesn't contain the due date
    await expect(page.locator('[aria-label="Text editor"]')).not.toHaveText(
      dueDateTag
    );

    // open the date picker
    await page.locator(datePickerButton).click();

    // choose date and confirm
    await page.locator(dueDateSelector).click();
    if (isMobile) {
      await page.locator("button >> text=OK").click();
    }

    // make sure the date picker contain a value
    await expectDateValue(page, "Due date", format(today, "MM/dd/yyyy"));

    // make sure the text field contains the due date
    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      dueDateTag
    );

    // open the date picker
    await page.locator(datePickerButton).click();

    // clear date selection
    await page.locator("text=Clear").click();

    // make sure the text field doesn't contain the due date
    await expect(page.locator('[aria-label="Text editor"]')).not.toHaveText(
      dueDateTag
    );
  });

  test("should allow me to edit a task", async ({ page }) => {
    // select existing task in the list
    await page.locator("text=Pay the invoice").click();

    // make sure the task text is set
    await expect(page.locator('[aria-label="Text editor"]')).toHaveText(
      "Pay the invoice +CompanyB @Work due:2021-12-15"
    );

    // make sure the creation date is set
    await expectDateValue(page, "Creation date", "11/26/2021");

    // make sure the due date is set
    await expectDateValue(page, "Due date", "12/15/2021");

    // make sure priority is set
    await expect(
      page.locator('[aria-label="Select task priority"]')
    ).toHaveValue("A");
  });

  test("should accept the entered text as a context after blur from input", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "blur not working correctly");

    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @pr"
    );

    await expect(
      page.locator('[role="menuitem"] >> text=Add "pr"')
    ).toHaveCount(1);

    await expect(
      page.locator('[role="menuitem"] >> text="Private"')
    ).toHaveCount(1);

    await page.locator('[aria-label="Text editor"]').evaluate((e) => e.blur());

    await expect(page.locator('[role="menuitem"] >> text=Add pr')).toHaveCount(
      0
    );

    // make sure there is no open dropdown menu with suggestions
    await expect(page.locator('[data-testid="mentions-portal"]')).toHaveCount(
      0
    );

    // makes sure that the context was added
    await expect(page.locator('[data-testid="mention-pr"]')).toHaveCount(1);
  });

  test("should allow me to add new contexts via space bar", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @pr ",
      delay
    );

    await page
      .getByRole("textbox", { name: "Text editor" })
      .evaluate((e) => e.blur());

    // make sure context was added
    await expect(page.locator('[data-testid="mention-pr"]')).toHaveText("@pr");

    // make sure there is no open dropdown menu with suggestions
    await expect(page.locator('[data-testid="mentions-portal"]')).toHaveCount(
      0
    );
  });

  test("should allow me to fix a new context before inserting it", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type(
      '[aria-label="Text editor"]',
      "Play soccer with friends @Hpb",
      delay
    );

    await page.keyboard.press("ArrowLeft");
    await page.press('[aria-label="Text editor"]', "Backspace");
    await page.press('[aria-label="Text editor"]', "o");
    await page.keyboard.press("ArrowRight");
    await page.type('[aria-label="Text editor"]', "by ", delay);

    // make sure context was added
    await expect(page.locator('[data-testid="mention-Hobby"]')).toHaveText(
      "@Hobby"
    );
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
      page.locator('[role="menuitem"] >> text=Add Private')
    ).toHaveCount(0);

    await expect(
      page.locator('[role="menuitem"] >> text="Private"')
    ).toHaveCount(1);
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
      page.locator('[role="menuitem"] >> text=Add "private"')
    ).toHaveCount(1);

    await expect(
      page.locator('[role="menuitem"] >> text="Private"')
    ).toHaveCount(1);
  });

  test("should allow me to create a new task by using the keyboard only", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");

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
    await expectDateValue(page, "Due date", format(new Date(), "MM/dd/yyyy"));

    // navigate to save button
    await page.keyboard.press("Tab");
  });

  test("should consider pressing the escape key", async ({ page }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await expect(page.getByTestId("task-dialog")).toBeVisible();

    // open dropdown menu with suggestions
    await page.type('[aria-label="Text editor"]', "@Private");

    // close dropdown menu with suggestions by pressing the Escape key
    await page.keyboard.press("Escape");

    // make sure that the dialog is still open
    await expect(page.getByTestId("task-dialog")).toBeVisible();

    // close the dialog by pressing the Escape key
    await page.keyboard.press("Escape");

    // make sure that the dialog is closed
    await expect(page.getByTestId("task-dialog")).not.toBeVisible();
  });

  test("should insert spaces when adding mentions via keyboard", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type('[aria-label="Text editor"]', "@Private");

    await page.keyboard.press("Enter");

    await page.type('[aria-label="Text editor"]', "@Private", delay);

    await page.keyboard.press("Enter", delay);

    await expect(page.locator('[data-testid="mention-Private"]')).toHaveCount(
      2
    );

    // delete mention + space
    await page.press('[aria-label="Text editor"]', "Backspace", delay);
    await page.press('[aria-label="Text editor"]', "Backspace", delay);

    await expect(page.locator('[data-testid="mention-Private"]')).toHaveCount(
      1
    );
  });

  test("should insert spaces when adding mentions via mouse click", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type('[aria-label="Text editor"]', "@Private", delay);

    await page.locator('[role="menuitem"] >> text="Private"').click(delay);

    await page.type('[aria-label="Text editor"]', "@Private", delay);

    await page.locator('[role="menuitem"] >> text="Private"').click(delay);

    await expect(page.locator('[data-testid="mention-Private"]')).toHaveCount(
      2
    );

    // delete mention + space
    await page.press('[aria-label="Text editor"]', "Backspace");
    await page.press('[aria-label="Text editor"]', "Backspace");

    await expect(page.locator('[data-testid="mention-Private"]')).toHaveCount(
      1
    );
  });

  test("should insert a new mention", async ({ page }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.type('[aria-label="Text editor"]', "@Test");

    await page.locator('[role="menuitem"] >> text=Add "Test"').click();

    await expect(page.locator('[data-testid="mention-Test"]')).toHaveCount(1);
  });

  test("should add add and remove recurrence", async ({ page }) => {
    await page.locator('button[aria-label="Add task"]').click();

    await page.locator('[aria-label="Select unit"]').click();

    await page.locator('text="Days"').click();

    await page.locator('[aria-label="Amount"]').focus();

    await page.keyboard.press("ArrowUp");

    await expect(page.locator('[aria-label="Amount"]')).toHaveValue("2");

    // make sure rec-tag was added
    await expect(page.locator('[data-testid="mention-2d"]')).toHaveText(
      "rec:2d"
    );

    await page.locator('[aria-label="Select unit"]').click();

    await page.locator('text="No recurrence"').click();

    // make sure rec-tag was removed
    await expect(page.locator('[data-testid="mention-2d"]')).toHaveCount(0);
  });
});
