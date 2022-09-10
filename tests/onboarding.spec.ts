import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
});

test.describe("Onboarding", () => {
  test("should show the onboarding header", async ({ page }) => {
    await expect(page.locator("text=Get Started").first()).toBeVisible();
  });
});

test.describe("New file", () => {
  test("should allow me to create a new file", async ({ page }) => {
    await page.locator('[aria-label="Create task"]').click();

    await expect(page.locator('[aria-label="File name"]')).toHaveValue(
      "todo.txt"
    );

    await page.locator('[aria-label="Create file"]').click();

    await expect(page).toHaveURL("http://127.0.0.1:5173/?active=todo.txt");

    await expect(page.locator('[aria-label="Text editor"]')).toBeFocused();
  });
});

test.describe("Example file", () => {
  test("should allow me to create an example file", async ({ page }) => {
    await page.locator('[aria-label="Create example file"]').click();

    await expect(page.locator('[aria-label="File name"]')).toHaveValue(
      "todo.txt"
    );

    await page.locator('[aria-label="Create file"]').click();

    await expect(page).toHaveURL("http://127.0.0.1:5173/?active=todo.txt");

    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
  });
});

test.describe("File import", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should allow me to import files", async ({ page }) => {
    const content = readFileSync("public/todo.txt");

    await expect(page.locator("text=Import todo.txt")).toBeVisible();

    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo1.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    await expect(page.locator('[aria-label="File menu"]')).toHaveText(
      "todo1.txt"
    );

    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo2.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    await expect(page.locator('[aria-label="File menu"]')).toHaveText(
      "todo2.txt"
    );

    await page.locator('[aria-label="File menu"]').click();

    await page.locator("text=All").click();

    await expect(page.locator('[aria-label="Task"]')).toHaveCount(16);
  });

  test("should allow me to import files via drag and drop", async ({
    page,
  }) => {
    const content = readFileSync("public/todo.txt");

    const dataTransfer = await page.evaluateHandle((text) => {
      const dt = new DataTransfer();
      const file = new File([text], "todo.txt", {
        type: "text/plain",
      });
      dt.items.add(file);
      return dt;
    }, content.toString());

    // dispatch drop event
    await page.dispatchEvent('[data-testid="dropzone"]', "drop", {
      dataTransfer,
    });

    await expect(page.locator('[aria-label="Task"]')).toHaveCount(8);
  });
});
