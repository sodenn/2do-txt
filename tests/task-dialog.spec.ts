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
  test("should open and close the task dialog by using keyboard shortcuts", async ({
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
    await getEditor(page).pressSequentially("This is a task", delay);
    await expect(page.getByRole("button", { name: "Save task" })).toBeEnabled();
  });

  test("should select a context via enter key", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");

    await openTaskDialog(page);

    await expect(getEditor(page)).toBeFocused();

    await getEditor(page).pressSequentially(
      "Play soccer with friends @",
      delay,
    );

    await page.keyboard.press("Enter");

    // open the mention menu again
    await getEditor(page).press("@", delay);
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

  test("should keep due date picker and text field in sync", async ({
    page,
    isMobile,
  }) => {
    await openTaskDialog(page);
    if (!isMobile) {
      await expect(getEditor(page)).toBeFocused();
    }

    // open the date picker
    await page.getByLabel("Due date").click();

    const today = new Date();
    const currentDateSelector = today.getDate().toString();
    const dueDateTag = `due:${formatDate(today)}`;

    // choose date and confirm
    await page.getByRole("gridcell", { name: currentDateSelector }).click();

    // make sure the date picker contains a value
    await expect(page.getByLabel("Due date")).toHaveText(
      isMobile
        ? format(today, "MM/dd/yyyy")
        : format(today, "EEE, MMM dd, yyyy"),
    );

    // make sure the text field contains the due date
    await expect(getEditor(page)).toHaveText(dueDateTag);

    // remove the due date from the text field
    await getEditor(page).click();
    await page.keyboard.press("End");
    await getEditor(page).press("Backspace");

    // make sure the date picker doesn't contain a value
    await expect(page.getByLabel("Due date")).toHaveText("");

    // make sure the text field doesn't contain the due date
    await expect(getEditor(page)).not.toHaveText(dueDateTag);

    // open the date picker
    await page.getByLabel("Due date").click();

    // choose date and confirm
    await page.getByRole("gridcell", { name: currentDateSelector }).click();

    // make sure the date picker contains a value
    await expect(page.getByLabel("Due date")).toHaveText(
      isMobile
        ? format(today, "MM/dd/yyyy")
        : format(today, "EEE, MMM dd, yyyy"),
    );

    // make sure the text field contains the due date
    await expect(getEditor(page)).toHaveText(dueDateTag);

    // open the date picker
    await page.getByLabel("Due date").click();

    // clear date selection
    await page.getByRole("gridcell", { name: currentDateSelector }).click();

    // make sure the text field doesn't contain the due date
    await expect(getEditor(page)).not.toHaveText(dueDateTag);
  });

  test("should fill the task dialog with the selected task", async ({
    page,
    isMobile,
  }) => {
    // select a task in list
    await page.getByText("Pay the invoice").click();

    // make sure the task text is set
    await expect(getEditor(page)).toHaveText(
      "Pay the invoice +CompanyB @Work due:2021-12-15",
    );

    // make sure the creation date is set
    await expect(page.getByLabel("Creation date")).toHaveText(
      isMobile ? "11/26/2021" : "Fri, Nov 26, 2021",
    );

    // make sure the due date is set
    await expect(page.getByLabel("Due date")).toHaveText(
      isMobile ? "12/15/2021" : "Wed, Dec 15, 2021",
    );

    // make sure priority is set
    await expect(page.getByLabel("Priority")).toHaveText("A");
  });

  test("should add new contexts when blur from input", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "blur not working correctly");

    await openTaskDialog(page);

    await getEditor(page).pressSequentially(
      "Play soccer with friends @pr",
      delay,
    );

    await expect(page.getByRole("menuitem", { name: "Private" })).toHaveCount(
      1,
    );

    await expect(page.getByRole("menuitem", { name: "Private" })).toHaveCount(
      1,
    );

    await getEditor(page).press("Enter");

    // make sure there is no open dropdown menu with suggestions
    await expect(page.getByRole("menuitem", { name: "Add pr" })).toHaveCount(0);
    await expect(
      page.getByRole("menu", { name: "Choose a mention" }),
    ).toHaveCount(0);

    // makes sure that the context was added
    await expect(
      page.locator('[data-beautiful-mention="@Private"]'),
    ).toHaveCount(1);
  });

  test("should fix a typo in a context before inserting it", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).pressSequentially(
      "Play soccer with friends @Hpb",
      delay,
    );

    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(50);
    await getEditor(page).press("Backspace");
    await page.waitForTimeout(50);
    await getEditor(page).press("o");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(50);
    await getEditor(page).pressSequentially("by");
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

    await getEditor(page).pressSequentially(
      "Play soccer with friends @Private",
      delay,
    );

    await expect(page.getByRole("menuitem", { name: "Private" })).toHaveCount(
      1,
    );
  });

  test("should respect upper case and lower case when adding new contexts", async ({
    page,
  }) => {
    await openTaskDialog(page);

    await getEditor(page).pressSequentially(
      "Play soccer with friends @private",
      delay,
    );

    await expect(
      page.getByRole("menuitem", { name: `Choose "private"`, exact: true }),
    ).toHaveCount(1);

    await expect(
      page.getByRole("menuitem", { name: `Choose "Private"`, exact: true }),
    ).toHaveCount(1);
  });

  test("should create a new task by using the keyboard only", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "not relevant for mobile browser");

    await openTaskDialog(page);

    // type task description
    await getEditor(page).pressSequentially("Play soccer with friends", delay);

    // select priority
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.keyboard.press("A");

    // make sure priority was selected
    await expect(page.getByLabel("Priority")).toHaveText("A");
    await page.waitForTimeout(500);

    // navigate to recurrence picker
    await page.keyboard.press("Tab");

    // select due date
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    const today = new Date();
    const currentDateSelector = today.getDate().toString();
    await page.getByRole("gridcell", { name: currentDateSelector }).click();

    // make sure due date was selected
    await expect(page.getByLabel("Due date")).toHaveText(
      format(today, "EEE, MMM dd, yyyy"),
    );
  });

  test("should consider pressing the escape key", async ({
    page,
    isMobile,
  }) => {
    await openTaskDialog(page);

    await expect(page.getByTestId("task-dialog")).toBeVisible();

    if (!isMobile) {
      // open dropdown menu with suggestions
      await getEditor(page).pressSequentially("@Private", delay);

      // close dropdown menu
      await page.keyboard.press("Escape");

      // make sure that the dialog is still open
      await expect(page.getByTestId("task-dialog")).toBeVisible();
    }

    // open recurrence selection
    await page.getByLabel("Recurrence").click();
    await page.waitForTimeout(200);

    // close selection
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await page.keyboard.press("Tab");

    // make sure that the dialog is still open
    await expect(page.getByTestId("task-dialog")).toBeVisible();

    // close the dialog by pressing the Escape key
    await page.keyboard.press("Escape");

    // make sure that the dialog is closed
    await expect(page.getByTestId("task-dialog")).not.toBeVisible();
  });

  test("should insert spaces when adding mentions", async ({ page }) => {
    await openTaskDialog(page);

    await getEditor(page).pressSequentially("@Private", delay);

    await page.getByRole("menuitem", { name: "Private" }).click();

    await getEditor(page).pressSequentially("@Private", delay);

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
    await getEditor(page).pressSequentially("@Test", delay);
    await page
      .getByRole("menuitem", { name: `Choose "Test"`, exact: true })
      .click();
    await expect(page.locator('[data-beautiful-mention="@Test"]')).toHaveCount(
      1,
    );
  });

  test("should add and remove recurrence", async ({ page }) => {
    await openTaskDialog(page);
    await page.getByLabel("Recurrence").click();
    await page.getByText("Days", { exact: true }).click();

    await page.getByRole("spinbutton", { name: "Amount" }).focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("spinbutton", { name: "Amount" })).toHaveValue(
      "2",
    );
    await page.keyboard.press("Escape");

    // make sure rec-tag was added
    await expect(page.locator('[data-beautiful-mention="rec:2d"]')).toHaveText(
      "rec:2d",
    );
    await page.getByLabel("Recurrence").first().click();
    await page.getByText("No recurrence").click();
    // make sure rec-tag was removed
    await expect(page.locator('[data-beautiful-mention="rec:2d"]')).toHaveCount(
      0,
    );
  });

  test("should delete a task", async ({ page }) => {
    await expect(page.getByTestId("task")).toHaveCount(8);
    await page.getByTestId("task").first().click();
    // make sure that the dialog is open
    await expect(page.getByTestId("task-dialog")).toBeVisible();
    await page.getByRole("button", { name: "Delete task" }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    // make sure that the dialog is closed
    await expect(page.getByTestId("task-dialog")).not.toBeVisible();
    await expect(page.getByTestId("task")).toHaveCount(7);
  });
});

async function openTaskDialog(page: Page) {
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForTimeout(400);
}

function getEditor(page: Page) {
  return page.getByRole("textbox", { name: "Text editor" });
}
