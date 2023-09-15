import { expect, Page, test } from "@playwright/test";
import { format } from "date-fns";

function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
});

const delay = { delay: 20 };

test.describe("Task dialog", () => {
  test("should allow me to open and close the task dialog via shortcut", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");
    await page.waitForTimeout(500);
    await page.keyboard.press("n");
    await expect(page.getByTestId("task-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("task-dialog")).not.toBeVisible();
  });

  test("should disable the save button when the task description is empty", async ({
    page,
  }) => {
    await page.waitForTimeout(500);
    await page.keyboard.press("n");
    await expect(page.getByTestId("task-dialog")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save task" }),
    ).toBeDisabled();
    await getEditor(page).type("This is a task", delay);
    await expect(page.getByRole("button", { name: "Save task" })).toBeEnabled();
  });

  test("should allow me to select contexts via enter", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");

    await openTaskDialog(page);

    await expect(getEditor(page)).toBeFocused();

    await getEditor(page).type("Play soccer with friends @", delay);

    await page.keyboard.press("Enter");

    // open the mention menu again
    await getEditor(page).type("@", delay);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(getEditor(page)).toHaveText(
      "Play soccer with friends @Private @Holiday",
    );

    // save the task
    await page.getByRole("button", { name: "Save task" }).click();

    // make sure the task is part of the list
    await expect(
      page
        .getByTestId("task")
        .getByText("Play soccer with friends @Private @Holiday"),
    ).toHaveCount(1);
  });

  test("should keep due date datepicker and text field in sync", async ({
    page,
    isMobile,
  }) => {
    await openTaskDialog(page);

    // make sure the editor is focused on desktop
    if (!isMobile) {
      await expect(getEditor(page)).toBeFocused();
    }

    // open the date picker
    const pickerButton = isMobile
      ? "Due date textfield"
      : "Due date pickerbutton";
    await page.getByTestId(pickerButton).click();

    const today = new Date();
    const currentDateSelector = '[aria-current="date"]';
    const dueDateTag = `due:${formatDate(today)}`;

    // choose date and confirm
    await page.locator(currentDateSelector).click();
    if (isMobile) {
      await page.getByRole("button", { name: "OK" }).click();
    }

    // make sure the date picker contain a value
    await expect(page.getByTestId("Due date textfield")).toHaveValue(
      format(today, "MM/dd/yyyy"),
    );

    // make sure the text field contains the due date
    await expect(getEditor(page)).toHaveText(dueDateTag);

    // remove the due date from the text field
    await getEditor(page).click();
    await page.keyboard.press("End");
    await getEditor(page).press("Backspace");

    // make sure the date picker doesn't contain a value
    await expect(page.getByTestId("Due date textfield")).toHaveValue("");

    // make sure the text field doesn't contain the due date
    await expect(getEditor(page)).not.toHaveText(dueDateTag);

    // open the date picker
    await page.getByTestId(pickerButton).click();

    // choose date and confirm
    await page.locator(currentDateSelector).click();
    if (isMobile) {
      await page.getByRole("button", { name: "OK" }).click();
    }

    // make sure the date picker contain a value
    await expect(page.getByTestId("Due date textfield")).toHaveValue(
      format(today, "MM/dd/yyyy"),
    );

    // make sure the text field contains the due date
    await expect(getEditor(page)).toHaveText(dueDateTag);

    // open the date picker
    await page.getByTestId(pickerButton).click();

    // clear date selection
    await page.getByRole("button", { name: "Clear" }).click();

    // make sure the text field doesn't contain the due date
    await expect(getEditor(page)).not.toHaveText(dueDateTag);
  });

  test("should allow me to edit a task", async ({ page }) => {
    // select existing task in the list
    await page.getByText("Pay the invoice").click();

    // make sure the task text is set
    await expect(getEditor(page)).toHaveText(
      "Pay the invoice +CompanyB @Work due:2021-12-15",
    );

    // make sure the creation date is set
    await expect(page.getByTestId("Creation date textfield")).toHaveValue(
      "11/26/2021",
    );

    // make sure the due date is set
    await expect(page.getByTestId("Due date textfield")).toHaveValue(
      "12/15/2021",
    );

    // make sure priority is set
    await expect(
      page.getByRole("combobox", { name: "Select task priority" }),
    ).toHaveValue("A");
  });

  test("should accept the entered text as a context after blur from input", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "blur not working correctly");

    await openTaskDialog(page);

    await getEditor(page).type("Play soccer with friends @pr", delay);

    await expect(page.getByRole("menuitem", { name: "Private" })).toHaveCount(
      1,
    );

    await expect(
      page.getByRole("menuitem", { name: `Choose "pr"` }),
    ).toHaveCount(1);

    await getEditor(page).press("ArrowDown");

    await getEditor(page).evaluate((e) => e.blur());

    await expect(page.getByRole("menuitem", { name: "Add pr" })).toHaveCount(0);

    // make sure there is no open dropdown menu with suggestions
    await expect(
      page.getByRole("menu", { name: "Choose a mention" }),
    ).toHaveCount(0);

    // makes sure that the context was added
    await expect(page.locator('[data-beautiful-mention="@pr"]')).toHaveCount(1);
  });

  test("should allow me to add new contexts when blur from input", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).type("Play soccer with friends @pr", delay);

    await page.getByRole("menuitem", { name: `Choose "pr"` }).click();

    await getEditor(page).evaluate((e) => e.blur());

    // make sure context was added
    await expect(page.locator('[data-beautiful-mention="@pr"]')).toHaveText(
      "@pr",
    );

    // make sure there is no open dropdown menu with suggestions
    await expect(
      page.getByRole("menu", { name: "Choose a mention" }),
    ).toHaveCount(0);
  });

  test("should allow me to fix a typo in a context before inserting it", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).type("Play soccer with friends @Hpb", delay);

    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(50);
    await getEditor(page).press("Backspace");
    await page.waitForTimeout(50);
    await getEditor(page).press("o");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(50);
    await getEditor(page).type("by");
    await page.waitForTimeout(50);
    await page.keyboard.press("Space");

    // make sure context was added
    await expect(page.locator('[data-beautiful-mention="@Hobby"]')).toHaveText(
      "@Hobby",
    );
  });

  test("should no longer show the option to create a new context when the context already exist", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).type("Play soccer with friends @Private", delay);

    await expect(
      page.getByRole("menuitem", { name: `Add "Private"` }),
    ).toHaveCount(0);

    await expect(page.getByRole("menuitem", { name: "Private" })).toHaveCount(
      1,
    );
  });

  test("should respect upper case and lower case when adding new contexts", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).type("Play soccer with friends @private", delay);

    await expect(
      page.getByRole("menuitem", { name: `Choose "private"`, exact: true }),
    ).toHaveCount(1);

    await expect(
      page.locator('[role="menuitem"] >> text="Private"'),
    ).toHaveCount(1);
  });

  test("should allow me to create a new task by using the keyboard only", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");

    await openTaskDialog(page);

    // type task description
    await getEditor(page).type("Play soccer with friends", delay);

    // navigate to priority input
    await page.keyboard.press("Tab");

    // select priority
    await page.keyboard.press("A");

    // make sure priority was selected
    await expect(
      page.locator('[aria-label="Select task priority"]'),
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
    await expect(page.getByTestId("Due date textfield")).toHaveValue(
      format(new Date(), "MM/dd/yyyy"),
    );

    // navigate to save button
    await page.keyboard.press("Tab");
  });

  test("should consider pressing the escape key", async ({ page }) => {
    await openTaskDialog(page);

    await expect(page.getByTestId("task-dialog")).toBeVisible();

    // open dropdown menu with suggestions
    await getEditor(page).type("@Private", delay);

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
    isMobile,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).type("@Private", delay);

    isMobile
      ? await page.getByRole("menuitem", { name: "Private" }).click()
      : await page.keyboard.press("Enter");

    await getEditor(page).type("@Private", delay);

    isMobile
      ? await page.getByRole("menuitem", { name: "Private" }).click()
      : await page.keyboard.press("Enter");

    await expect(
      page.locator('[data-beautiful-mention="@Private"]'),
    ).toHaveCount(2);

    // delete mention + space
    await getEditor(page).press("Backspace");
    await getEditor(page).press("Backspace");

    await expect(
      page.locator('[data-beautiful-mention="@Private"]'),
    ).toHaveCount(1);
  });

  test("should insert spaces when adding mentions via mouse click", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).type("@Private", delay);

    await page.getByRole("menuitem", { name: "Private" }).click();

    await getEditor(page).type("@Private", delay);

    await page.getByRole("menuitem", { name: "Private" }).click();

    await expect(
      page.locator('[data-beautiful-mention="@Private"]'),
    ).toHaveCount(2);

    // delete mention + space
    await getEditor(page).press("Backspace");
    await getEditor(page).press("Backspace");

    await expect(
      page.locator('[data-beautiful-mention="@Private"]'),
    ).toHaveCount(1);
  });

  test("should insert a new mention", async ({ page }) => {
    await openTaskDialog(page);
    await page.waitForTimeout(500);
    await getEditor(page).type("@Test", delay);
    await page
      .getByRole("menuitem", { name: `Choose "Test"`, exact: true })
      .click();
    await expect(page.locator('[data-beautiful-mention="@Test"]')).toHaveCount(
      1,
    );
  });

  test("should add add and remove recurrence", async ({ page }) => {
    await openTaskDialog(page);
    await page.getByLabel("Recurrence").click();
    await page.getByText("Days", { exact: true }).click();

    await page.getByRole("spinbutton", { name: "Amount" }).focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("spinbutton", { name: "Amount" })).toHaveValue(
      "2",
    );

    // make sure rec-tag was added
    await expect(page.locator('[data-beautiful-mention="rec:2d"]')).toHaveText(
      "rec:2d",
    );
    await page.getByLabel("Recurrence").click();
    await page.getByText("No recurrence").click();
    // make sure rec-tag was removed
    await expect(page.locator('[data-beautiful-mention="rec:2d"]')).toHaveCount(
      0,
    );
  });
});

async function openTaskDialog(page: Page) {
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForTimeout(400);
}

function getEditor(page: Page) {
  return page.getByRole("textbox", { name: "Text editor" });
}
