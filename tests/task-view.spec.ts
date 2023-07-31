import { expect, test } from "@playwright/test";

const withoutFile = ["should render an empty task list"];

test.beforeEach(async ({ page, isMobile }, testInfo) => {
  test.skip(!!isMobile, "desktop only");
  await page.goto("http://localhost:5173");
  if (withoutFile.every((f) => !testInfo.title.includes(f))) {
    await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  }
  if (testInfo.title.startsWith("timeline:")) {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Select task view" }).click();
    await page.getByRole("option", { name: "Timeline View" }).click();
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page
      .getByRole("button", { name: "Toggle menu" })
      .evaluate((e) => e.blur());
  }
  await page.waitForTimeout(200);
});

test.describe("Task View", () => {
  for (const taskView of ["list", "timeline"]) {
    test(`${taskView}: should render an empty task list`, async ({ page }) => {
      await expect(
        page.getByRole("list", { name: "Task list" }),
      ).not.toBeVisible();
    });

    test(`${taskView}: should render a task list with items`, async ({
      page,
    }) => {
      await expect(page.getByRole("list", { name: "Task list" })).toBeVisible();
      await expect(page.getByTestId("task")).toHaveCount(8);
    });

    test(`${taskView}: should navigate through the task list by using the tab key`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-button").nth(0)).not.toBeFocused();
      await page.keyboard.press("Tab"); // window
      await page.keyboard.press("Tab"); // file menu
      await page.keyboard.press("Tab"); // first list item
      await expect(page.getByTestId("task-button").nth(0)).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("task-button").nth(0)).not.toBeFocused();
      await expect(page.getByTestId("task-button").nth(1)).toBeFocused();
    });

    test(`${taskView}: should navigate through task list by using the arrow keys`, async ({
      page,
    }) => {
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("task-button").nth(0)).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("task-button").nth(0)).not.toBeFocused();
      await expect(page.getByTestId("task-button").nth(1)).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("task-button").nth(0)).toBeFocused();
      await expect(page.getByTestId("task-button").nth(1)).not.toBeFocused();
    });

    test(`${taskView}: should complete a task by clicking the checkbox`, async ({
      page,
    }) => {
      const taskCheckbox = page
        .getByTestId("task")
        .nth(0)
        .locator('input[type="checkbox"]');
      await expect(taskCheckbox).not.toBeChecked();
      await taskCheckbox.click();
      await expect(taskCheckbox).toBeChecked();
      // make sure that the click does not open the task dialog
      await expect(page.getByTestId("task-dialog")).not.toBeVisible();
    });

    test(`${taskView}: should complete a task by pressing the space key`, async ({
      page,
    }) => {
      const taskCheckbox = page
        .getByTestId("task")
        .nth(0)
        .locator('input[type="checkbox"]');
      await taskCheckbox.focus();
      await expect(taskCheckbox).not.toBeChecked();
      await page.keyboard.press("Space");
      await expect(taskCheckbox).toBeChecked();
    });

    test(`${taskView}: should edit a task by pressing the shortcut key`, async ({
      page,
    }) => {
      await page.getByTestId("task-button").nth(0).focus();
      await page.keyboard.press("e");
      await expect(page.getByTestId("task-dialog")).toBeVisible();
    });

    test(`${taskView}: should open the task dialog by pressing enter`, async ({
      page,
    }) => {
      await page.getByTestId("task-button").nth(0).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("task-dialog")).toBeVisible();
    });

    test(`${taskView}: should hide completed task`, async ({
      page,
    }, testInfo) => {
      if (testInfo.title.startsWith("timeline:")) {
        test.skip();
      }

      // enable "Hide completed" tasks
      await page.getByRole("button", { name: "Toggle menu" }).click();
      await page
        .getByRole("checkbox", { name: "Hide completed tasks" })
        .click();
      await page.keyboard.press("Escape");

      const taskItem = page.getByTestId("task-button").nth(0);

      await expect(taskItem).toHaveText(
        "Ask John for a jogging session @Private",
      );
      await page
        .getByTestId("task")
        .nth(0)
        .getByRole("checkbox", { name: "Complete task" })
        .click();
      await expect(taskItem).not.toHaveText(
        "Ask John for a jogging session @Private",
      );
    });

    test(`${taskView}: should delete a task via the task menu`, async ({
      page,
    }, testInfo) => {
      if (testInfo.title.startsWith("timeline:")) {
        test.skip();
      }
      await expect(page.getByTestId("task")).toHaveCount(8);
      const taskButton = page.getByTestId("task-button").nth(1);
      await taskButton.hover();
      await taskButton.getByRole("button", { name: "Task menu" }).click();
      await page.getByRole("menuitem", { name: "Delete task" }).click();
      // confirm deletion
      await page.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByTestId("task")).toHaveCount(7);
    });
  }
});
