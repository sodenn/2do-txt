import {
  expect,
  Page,
  PageAssertionsToHaveScreenshotOptions,
  test,
} from "@playwright/test";
import {
  createExampleFile,
  createTask,
  getEditor,
  goto,
} from "./playwright-utils";

test.beforeEach(async ({ page }) => {
  await goto(page);
});

const screenshotOptions: PageAssertionsToHaveScreenshotOptions = {
  maxDiffPixelRatio: 0.3,
};

test.describe("Screenshots", () => {
  test("should take a screenshot of the onboarding screen", async ({
    page,
  }) => {
    await expect(page.getByText("Get Started")).toBeVisible();
    await expect(page).toHaveScreenshot(screenshotOptions);
  });

  test("should take a screenshot of the task list", async ({ page }) => {
    await createExampleFile(page);
    await expect(page).toHaveScreenshot(screenshotOptions);
  });

  test("should take a screenshot of a empty task list", async ({ page }) => {
    await createEmptyFile(page);
    await expect(page).toHaveScreenshot(screenshotOptions);
  });

  test("should take a screenshot of the task timeline", async ({ page }) => {
    await changeToTimelineView(page);
    await createExampleFile(page);
    await expect(page).toHaveScreenshot(screenshotOptions);
  });

  test("should take a screenshot of a empty task timeline", async ({
    page,
  }) => {
    await changeToTimelineView(page);
    await createEmptyFile(page);
    await expect(page).toHaveScreenshot(screenshotOptions);
  });

  test("should take a screenshot of the task dialog", async ({ page }) => {
    await createExampleFile(page);
    await page.getByTestId("task").first().click();
    await expect(page.locator(`[data-state="open"]`).first()).toBeVisible();
    await expect(page).toHaveScreenshot(screenshotOptions);
  });

  test("should take a screenshot of the mention menu", async ({ page }) => {
    await createExampleFile(page);
    await page.getByTestId("task").first().click();
    await expect(getEditor(page)).toBeFocused();
    await page.keyboard.press("End");
    await getEditor(page).press("@", { delay: 20 });
    await expect(page).toHaveScreenshot(screenshotOptions);
  });
});

async function createEmptyFile(page: Page) {
  await createTask(page);
  await page.keyboard.press("Escape");
}

async function changeToTimelineView(page: Page) {
  await expect(page.getByRole("button", { name: "Toggle menu" })).toBeVisible();
  await page.keyboard.press("m");
  await page.getByLabel("Select task view").click();
  await page.getByLabel("Timeline").click();
  await page.keyboard.press("m");
}
