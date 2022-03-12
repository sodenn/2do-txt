import { expect, test } from "@playwright/test";
import { format } from "date-fns";
import { formatDate } from "../src/utils/date";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.setInputFiles("input#file-picker", "resources/todo.txt");
});

test.describe("Task editor", () => {
  // test("should allow me to add a task with contexts", async ({ page }) => {
  //   await page.locator("button[aria-label='Add task']").click();
  //
  //   await expect(page.locator("div[aria-label='Text editor']")).toBeFocused();
  //
  //   await page.type(
  //     "div[aria-label='Text editor']",
  //     "Play soccer with friends @"
  //   );
  //
  //   await page.locator('div[role="option"]:has-text("Private")').click();
  //
  //   await page.type("div[aria-label='Text editor']", "@");
  //
  //   await page.keyboard.press("ArrowDown");
  //   await page.keyboard.press("Enter");
  //
  //   await expect(page.locator("div[aria-label='Text editor']")).toHaveText(
  //     "Play soccer with friends @Private @Holiday"
  //   );
  // });

  test("should allow me to add a task with a due date", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName === "firefox",
      "date cannot be entered because the mobile version of the date picker is being used"
    );

    await page.locator("button[aria-label='Add task']").click();

    await expect(page.locator("div[aria-label='Text editor']")).toBeFocused();

    if (isMobile) {
      await page.locator("[aria-label='Due date']").click();
    } else {
      await page
        .locator("[aria-label='Choose date']:right-of([aria-label='Due date'])")
        .click();
    }

    const today = new Date();
    const selector = `[aria-label="${format(today, "MMM dd, yyyy")}"]`;
    const dueDateTag = `due:${formatDate(today)}`;

    await page.locator(selector).click();
    if (isMobile) {
      await page.locator("button >> text=OK").click();
    }

    await expect(page.locator("div[aria-label='Text editor']")).toHaveText(
      dueDateTag
    );

    await page.press("div[aria-label='Text editor']", "Backspace");
    await page.press("div[aria-label='Text editor']", "Backspace");

    await expect(page.locator("div[aria-label='Text editor']")).toHaveText("");
  });

  test("should allow me to edit a task", async ({ page }) => {
    await page.locator("text=Pay the invoice").click();

    await expect(page.locator("div[aria-label='Text editor']")).toHaveText(
      "Pay the invoice +CompanyB @Work due:2021-12-15"
    );

    await expect(page.locator("input[aria-label='Creation date']")).toHaveValue(
      "11/26/2021"
    );

    await expect(page.locator("input[aria-label='Due date']")).toHaveValue(
      "12/15/2021"
    );

    await expect(
      page.locator("div[aria-label='Select task priority']")
    ).toHaveText("A");
  });
});
