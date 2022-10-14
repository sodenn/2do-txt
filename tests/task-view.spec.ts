import { expect, Page, test } from "@playwright/test";

test.beforeEach(async ({ page, isMobile }, testInfo) => {
  test.skip(!!isMobile, "desktop only");
  await page.goto("http://127.0.0.1:5173");
  if (testInfo.title.startsWith("timeline:")) {
    await page.locator('[aria-label="Toggle menu"]').click();
    await page.locator('[role="tab"][aria-label="Settings"]').click();
    await page.locator('[aria-label="Select task view"]').click();
    await page.locator('[data-value="timeline"]').click();
    await page.locator('[aria-label="Toggle menu"]').click();
    await page.locator('[aria-label="Toggle menu"]').evaluate((e) => e.blur());
  }
});

async function openTodoTxt(page: Page) {
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await page.waitForTimeout(200);
}

test.describe("Task View", () => {
  for (const taskView of ["list", "timeline"]) {
    test(`${taskView}: should render an empty task list`, async ({ page }) => {
      await expect(page.locator('[aria-label="Task list"]')).not.toBeVisible();
    });

    test(`${taskView}: should render a task list with items`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      await expect(page.locator('[aria-label="Task list"]')).toBeVisible();
      await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
    });

    test(`${taskView}: should navigate through the task list by using the tab key`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      await expect(
        page.locator('[data-testid="task-button"]').nth(0)
      ).not.toBeFocused();
      await page.keyboard.press("Tab"); // window
      await page.keyboard.press("Tab"); // file menu
      await page.keyboard.press("Tab"); // first list item
      await expect(
        page.locator('[data-testid="task-button"]').nth(0)
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        page.locator('[data-testid="task-button"]').nth(0)
      ).not.toBeFocused();
      await expect(
        page.locator('[data-testid="task-button"]').nth(1)
      ).toBeFocused();
    });

    test(`${taskView}: should navigate through task list by using the arrow keys`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      await page.keyboard.press("ArrowDown");
      await expect(
        page.locator('[data-testid="task-button"]').nth(0)
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        page.locator('[data-testid="task-button"]').nth(0)
      ).not.toBeFocused();
      await expect(
        page.locator('[data-testid="task-button"]').nth(1)
      ).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(
        page.locator('[data-testid="task-button"]').nth(0)
      ).toBeFocused();
      await expect(
        page.locator('[data-testid="task-button"]').nth(1)
      ).not.toBeFocused();
    });

    test(`${taskView}: should complete a task by clicking the checkbox`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      const taskCheckbox = page
        .locator('[aria-label="Task"]')
        .nth(0)
        .locator('input[type="checkbox"]');
      await expect(taskCheckbox).not.toBeChecked();
      await taskCheckbox.click();
      await expect(taskCheckbox).toBeChecked();
      // make sure that the click does not open the task dialog
      await expect(
        page.locator('[aria-label="Task dialog"]')
      ).not.toBeVisible();
    });

    test(`${taskView}: should complete a task by pressing the space key`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      const taskCheckbox = page
        .locator('[aria-label="Task"]')
        .nth(0)
        .locator('input[type="checkbox"]');
      await taskCheckbox.focus();
      await expect(taskCheckbox).not.toBeChecked();
      await page.keyboard.press("Space");
      await expect(taskCheckbox).toBeChecked();
    });

    test(`${taskView}: should open the task dialog by pressing enter`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      await page.locator('[data-testid="task-button"]').nth(0).focus();
      await page.keyboard.press("e");
      await expect(page.locator('[aria-label="Task dialog"]')).toBeVisible();
    });

    test(`${taskView}: should edit a task by pressing the shortcut key`, async ({
      page,
    }) => {
      await openTodoTxt(page);
      await page.locator('[data-testid="task-button"]').nth(0).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator('[aria-label="Task dialog"]')).toBeVisible();
    });

    test(`${taskView}: should hide completed task`, async ({
      page,
    }, testInfo) => {
      if (testInfo.title.startsWith("timeline:")) {
        test.skip();
      }
      await openTodoTxt(page);

      // enable "Hide completed" tasks
      await page.keyboard.press("m");
      await page.locator('[aria-label="Hide completed tasks"]').click();
      await page.keyboard.press("Escape");

      const taskItem = page.locator('[data-testid="task-button"]').nth(0);

      await expect(taskItem).toHaveText(
        "Ask John for a jogging session @Private"
      );
      await page
        .locator('[aria-label="Task"]')
        .nth(0)
        .locator('input[type="checkbox"]')
        .click();
      await expect(taskItem).not.toHaveText(
        "Ask John for a jogging session @Private"
      );
    });

    test(`${taskView}: should delete a task via the task menu`, async ({
      page,
    }, testInfo) => {
      if (testInfo.title.startsWith("timeline:")) {
        test.skip();
      }
      await openTodoTxt(page);
      await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
      const taskButton = page.locator('[data-testid="task-button"]').nth(1);
      await taskButton.hover();
      await taskButton.locator('[aria-label="Task menu"]').click();
      await page.locator('[role="menuitem"][aria-label="Delete task"]').click();
      await page
        .locator('[aria-label="Confirmation Dialog"] [aria-label="Delete"]')
        .click();
      await expect(page.locator('[aria-label="Task"]')).toHaveCount(7);
    });
  }
});
