import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
});

test.describe("Onboarding", () => {
  test("should display the onboarding header", async ({ page }) => {
    await expect(page.locator("text=Get Started").first()).toBeVisible();
  });
});

test.describe("New file", () => {
  test("should allow me to create a new file", async ({ page }) => {
    await page.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByRole("textbox", { name: "File name" })).toHaveValue(
      "todo.txt"
    );
    await page.getByRole("button", { name: "Create file" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:5173/?active=todo.txt");
    // The task dialog should open and the focus should be in the editor
    await expect(
      page.getByRole("textbox", { name: "Text editor" })
    ).toBeFocused();
  });
});

test.describe("Example file", () => {
  test("should allow me to create an example file", async ({ page }) => {
    await page.getByRole("button", { name: "Create example file" }).click();
    await expect(page.getByRole("textbox", { name: "File name" })).toHaveValue(
      "todo.txt"
    );
    await page.getByRole("button", { name: "Create file" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:5173/?active=todo.txt");
    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});

test.describe("File import", () => {
  // webkit: Selecting multiple files does not work in the test
  test.skip(({ browserName }) => browserName === "webkit");

  test("should allow me to import files", async ({ page }) => {
    const content = readFileSync("public/todo.txt");
    await expect(
      page.getByRole("button", { name: "Import todo.txt" })
    ).toBeVisible();

    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo1.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
    await expect(page.getByRole("button", { name: "File menu" })).toHaveText(
      "todo1.txt"
    );

    await page.setInputFiles('[data-testid="file-picker"]', {
      name: "todo2.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
    await expect(page.getByRole("button", { name: "File menu" })).toHaveText(
      "todo2.txt"
    );

    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "All" }).click();
    await expect(page.getByTestId("task")).toHaveCount(16);
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

    await expect(page.getByTestId("task")).toHaveCount(8);
  });
});
