import { expect, test } from "@playwright/test";
import fs from "fs";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
});

test.describe("Onboarding", () => {
  // eslint-disable-next-line jest/valid-title
  test.skip(({ browserName }) => browserName === "webkit");

  test("should show the onboarding header", async ({ page }) => {
    await expect(page.locator("text=Get Started").first()).toBeVisible();
  });

  test("should allow me to add tasks", async ({ page }) => {
    await page.locator("button[aria-label='Create task']").click();

    await expect(page.locator("input[aria-label='File name']")).toHaveValue(
      "todo.txt"
    );

    await page.locator("button[aria-label='Create file']").click();

    await expect(page).toHaveURL("http://localhost:3000/?active=todo.txt");

    await expect(page.locator("div[aria-label='Text editor']")).toBeFocused();

    await page.type(
      "div[aria-label='Text editor']",
      "Play soccer with friends @Private"
    );

    await page.locator('div[role="option"]:has-text("Add Private")').click();

    await page.locator("button[aria-label='Save task']").click();
  });

  test("should allow me to import files", async ({ page }) => {
    const content = fs.readFileSync("resources/todo.txt");

    await page.setInputFiles("input#file-picker", {
      name: "todo1.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    await page.setInputFiles("input#file-picker", {
      name: "todo2.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    await page.locator('button:has-text("todo2.txt")').click();

    await page.locator("text=All").click();

    await expect(page.locator("[aria-label='Task']")).toHaveCount(16);
  });
});
