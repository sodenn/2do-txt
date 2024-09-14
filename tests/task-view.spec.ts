import { expect, test } from "@playwright/test";
import {
  createExampleFile,
  createTask,
  goto,
  toggleMenu,
} from "./playwright-utils";

const withoutFile = ["should render an empty task list"];

test.beforeEach(async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, "desktop only");
  await goto(page);
  if (withoutFile.every((f) => !testInfo.title.includes(f))) {
    await createExampleFile(page);
  }
  if (testInfo.title.startsWith("timeline:")) {
    await toggleMenu(page);
    await page.waitForTimeout(200);
    if (await page.getByRole("tab", { name: "Settings" }).isVisible()) {
      await page.getByRole("tab", { name: "Settings" }).click();
    }
    await page.getByLabel("Select task view").click();
    await page.getByLabel("Timeline").click();
    await page.getByLabel("Select task view").blur();
    await toggleMenu(page);
    await page
      .getByRole("button", { name: "Toggle menu" })
      .evaluate((e) => e.blur());
  }
});

test.describe("Task View", () => {
  for (const taskView of ["list", "timeline"]) {
    test(`${taskView}: should render an empty task list`, async ({ page }) => {
      await createTask(page);
      await page.getByRole("button", { name: "Close" }).click();
      if (taskView === "list") {
        await expect(page.getByText("No tasks")).toBeVisible();
      } else {
        await expect(page.getByText("Add new task")).toBeVisible();
      }
    });

    test(`${taskView}: should render a task list`, async ({ page }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      await expect(page.getByTestId("task")).toHaveCount(8);
    });

    test(`${taskView}: should navigate through the task list by using the tab key`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      const firstTask = page.getByTestId("task").first();
      await expect(firstTask).not.toBeFocused();
      await firstTask.focus();
      await expect(firstTask).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(firstTask).not.toBeFocused();
      await expect(
        firstTask.getByRole("button", { name: "Delete task" }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("task").nth(1)).toBeFocused();
    });

    test(`${taskView}: should navigate through task list by using the arrow keys`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      await expect(page.getByTestId("task")).toHaveCount(8);
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("task").nth(0)).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("task").nth(0)).not.toBeFocused();
      await expect(page.getByTestId("task").nth(1)).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("task").nth(0)).toBeFocused();
      await expect(page.getByTestId("task").nth(1)).not.toBeFocused();
    });

    test(`${taskView}: should complete a task by clicking the checkbox`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      const taskCheckbox = page.getByLabel("Complete task").nth(0);
      expect(await taskCheckbox.getAttribute("aria-checked")).toBe("false");
      await taskCheckbox.click();
      await page.waitForTimeout(300);
      expect(await taskCheckbox.getAttribute("aria-checked")).toBe("true");
      // make sure that the click does not open the task dialog
      await expect(page.getByTestId("task-dialog")).not.toBeVisible();
    });

    test(`${taskView}: should complete a task by pressing the space key`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("task").nth(0)).toBeFocused();
      const taskCheckbox = page.getByLabel("Complete task").nth(0);
      expect(await taskCheckbox.getAttribute("aria-checked")).toBe("false");
      await page.keyboard.press("Space");
      // make sure that the click does not open the task dialog
      await page.waitForTimeout(500);
      await expect(page.getByTestId("task-dialog")).not.toBeVisible();
      expect(await taskCheckbox.getAttribute("aria-checked")).toBe("true");
    });

    test(`${taskView}: should edit a task by using a keyboard shortcut`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      await page.getByTestId("task").nth(0).focus();
      await page.keyboard.press("e");
      await expect(page.getByTestId("task-dialog")).toBeVisible();
    });

    test(`${taskView}: should open the task dialog by pressing enter`, async ({
      page,
    }) => {
      await expect(page.getByTestId("task-list")).toBeVisible();
      await page.getByTestId("task").nth(0).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("task-dialog")).toBeVisible();
    });

    test(`${taskView}: should hide a completed task`, async ({
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

      const taskItem = page.getByTestId("task").nth(0);

      await expect(taskItem).toHaveText(
        "Ask John for a jogging session @Private",
      );
      await page.getByLabel("Complete task").nth(0).click();
      await expect(taskItem).not.toHaveText(
        "Ask John for a jogging session @Private",
      );
    });

    test(`${taskView}: should delete a task via shortcut`, async ({ page }) => {
      await expect(page.getByTestId("task")).toHaveCount(8);
      await page.getByTestId("task").nth(0).focus();
      await expect(page.getByTestId("task").nth(0)).toBeFocused();
      await page.keyboard.press("d");
      await expect(page.getByTestId("confirmation-dialog")).toBeVisible();
      await page.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByTestId("task")).toHaveCount(7);
    });
  }
});
