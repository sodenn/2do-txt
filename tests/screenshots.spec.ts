import { Page, expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://192.168.178.47:5173/");
});

test.describe("Screenshots", () => {
  test("should take a screenshot of the onboarding screen", async ({
    page,
  }) => {
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of the task list", async ({ page }) => {
    await selectFile(page);
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of the task timeline", async ({ page }) => {
    await changeToTimelineView(page);
    await selectFile(page);
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of the task dialog", async ({ page }) => {
    await selectFile(page);
    await page.getByTestId("task-button").first().click();
    await expect(page.getByTestId("task-dialog")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    await expect(page).toHaveScreenshot();
  });
});

async function selectFile(page: Page) {
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await expect(page.getByTestId("task-list")).toBeVisible();
}

async function changeToTimelineView(page: Page) {
  await expect(page.getByRole("button", { name: "Toggle menu" })).toBeVisible();
  await page.keyboard.press("m");
  await page.getByLabel("Task view", { exact: true }).click();
  await page.getByLabel("Timeline View").click();
  await page.keyboard.press("m");
}
