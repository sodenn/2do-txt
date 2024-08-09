import { expect, Page } from "@playwright/test";

export async function goto(page: Page) {
  await page.goto("http://localhost:5173");
  await expect(page.getByText("Get Started")).toBeVisible();
}

export async function createExampleFile(page: Page, filename?: string) {
  await goto(page);
  await page.getByLabel("Create example file").click();
  if (filename) {
    await page.getByLabel("Filename").fill(filename);
  }
  await createFile(page);
  await expect(page.getByTestId("file-create-dialog")).not.toBeVisible();
}

export async function createTask(page: Page) {
  await goto(page);
  await page.getByLabel("Create task").click();
  await createFile(page);
  await expect(page.getByTestId("file-create-dialog")).not.toBeVisible();
}

export async function createFile(page: Page) {
  await page.getByLabel("Create file").click();
}

export async function toggleMenu(page: Page) {
  await page.getByRole("button", { name: "Toggle menu" }).click();
}

export async function openSettings(page: Page) {
  await toggleMenu(page);
  await page.getByRole("tab", { name: "Settings" }).click();
}

export async function openFileMenu(page: Page) {
  await page.getByLabel("File menu").click();
  await page.getByRole("menuitem", { name: "Files…" }).click();
}
