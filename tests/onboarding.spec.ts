import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
  await expect(page.getByText("Get Started")).toBeVisible();
});

test.describe("Onboarding", () => {
  test("should tab through the onboarding buttons", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    await page.waitForTimeout(200);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Create task")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Create example file")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Import todo.txt")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByLabel("Connect to cloud storage").nth(1),
    ).toBeFocused();
  });
});

test.describe("New file", () => {
  test("should create a new todo.txt file", async ({ page, isMobile }) => {
    await page.getByLabel("Create task").click();
    await expect(page).toHaveURL("http://localhost:5173/?active=todo.txt");
    // The task dialog should open and the focus should be in the editor on desktop
    await expect(
      page.getByRole("textbox", { name: "Text editor" }),
    ).toBeFocused();
    // close the current file and create a new one and the same way
    await page.keyboard.press("Escape");
    await page.getByLabel("File menu").click();
    await page.getByRole("menuitem", { name: "Files…" }).click();
    await page.getByLabel("File actions").click();
    await page.getByLabel("Delete file").click();
    await page.getByLabel("Delete").click();
    await page.getByLabel("Create task").click();
    if (!isMobile) {
      await expect(
        page.getByRole("textbox", { name: "Text editor" }),
      ).toBeFocused();
    }
  });
});

test.describe("Example file", () => {
  test("should create an example todo.txt file", async ({ page }) => {
    await page.getByRole("button", { name: "Create example file" }).click();
    await expect(page).toHaveURL("http://localhost:5173/?active=todo.txt");
    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});

test.describe("File import", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should import a todo.txt file", async ({ page }) => {
    const content = readFileSync("public/todo.txt");
    await expect(
      page.getByRole("button", { name: "Import todo.txt" }),
    ).toBeVisible();

    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo1.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
    await expect(page.getByRole("button", { name: "File menu" })).toHaveText(
      "todo1.txt",
    );

    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo2.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
    await expect(page.getByRole("button", { name: "File menu" })).toHaveText(
      "todo2.txt",
    );

    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByLabel("All task lists").click();
    await expect(page.getByTestId("task")).toHaveCount(16);
  });

  test("should import a todo.txt file via drag and drop", async ({ page }) => {
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

    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});
