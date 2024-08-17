import { expect, Page } from "@playwright/test";
import { readFileSync } from "fs";

export async function goto(page: Page) {
  const host = process.env.HOST || "localhost";
  await page.goto(`http://${host}:5173/`);
  await expect(page.getByText("Get Started")).toBeVisible();
}

export async function createExampleFile(page: Page, filename?: string) {
  const onboarding = await page.getByLabel("Create example file").isVisible();
  if (onboarding) {
    await page.getByLabel("Create example file").click();
    if (filename) {
      await page.getByLabel("Filename").fill(filename);
    }
    await createFile(page);
    await expect(page.getByTestId("file-create-dialog")).not.toBeVisible();
  }
  if (!onboarding) {
    await openFileMenu(page);
    const content = readFileSync("public/todo.txt");
    await page.getByRole("button", { name: "Import todo.txt" }).click();
    await page.setInputFiles('[data-testid="file-picker"]', {
      name: filename ?? "todo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
  }
}

export async function createTask(page: Page) {
  await page.getByLabel("Create task").click();
  await createFile(page);
}

export async function createFile(page: Page) {
  await expect(page.getByTestId("file-create-dialog")).toBeVisible();
  await page.getByLabel("Create file").click();
  await expect(page.getByTestId("file-create-dialog")).not.toBeVisible();
}

export async function toggleMenu(page: Page) {
  await page.keyboard.press("m");
}

export async function openSettings(page: Page) {
  await toggleMenu(page);
  await page.getByRole("tab", { name: "Settings" }).click();
}

export async function openFileMenu(page: Page) {
  await page.getByLabel("File menu").click();
  await page.getByRole("menuitem", { name: "Files…" }).click();
}

export async function checkSearchParams(page: Page, searchParams = "") {
  await expect(page).toHaveURL(`http://localhost:5173${searchParams}`);
}
