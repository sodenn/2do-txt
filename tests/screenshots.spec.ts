import { expect, Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const host = process.env.HOST || "localhost";
  await page.goto(`http://${host}:5173/`);
});

test.describe("Screenshots", () => {
  test("should take a screenshot of the onboarding screen", async ({
    page,
  }) => {
    await expect(page.getByText("Get Started")).toBeVisible();
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of the task list", async ({ page }) => {
    await selectFile(page);
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of a empty task list", async ({ page }) => {
    await createEmptyFile(page);
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of the task timeline", async ({ page }) => {
    await changeToTimelineView(page);
    await selectFile(page);
    await expect(page).toHaveScreenshot();
  });

  test("should take a screenshot of a empty task timeline", async ({
    page,
  }) => {
    await changeToTimelineView(page);
    await createEmptyFile(page);
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

  test("should take a screenshot of the mention menu", async ({ page }) => {
    await selectFile(page);
    await page.getByTestId("task-button").first().click();
    await expect(page.getByTestId("task-dialog")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    await page.keyboard.press("@");
    await expect(page).toHaveScreenshot();
  });
});

async function selectFile(page: Page) {
  await page.setInputFiles('[data-testid="file-picker"]', "public/todo.txt");
  await expect(page.getByTestId("task-list")).toBeVisible();
}

async function createEmptyFile(page: Page) {
  await page.getByLabel("Create task").click();
  await page.getByTestId("task-dialog").getByLabel("Close").click();
}

async function changeToTimelineView(page: Page) {
  await expect(page.getByRole("button", { name: "Toggle menu" })).toBeVisible();
  await page.keyboard.press("m");
  await page.getByLabel("Task view", { exact: true }).click();
  await page.getByLabel("Timeline View").click();
  await page.keyboard.press("m");
}
