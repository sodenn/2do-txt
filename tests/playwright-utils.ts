import { expect, Page } from "@playwright/test";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function goto(page: Page) {
  const host = process.env.HOST || "localhost";
  await page.goto(`http://${host}:5173/`);
  await expect(page.getByText("Get Started")).toBeVisible();
}

export async function createExampleFile(page: Page, filename?: string) {
  const onboarding = await page.getByLabel("Create example list").isVisible();
  if (onboarding) {
    await page.getByLabel("Create example list").click();
    if (filename) {
      await page.getByLabel("Filename").fill(filename);
    }
    await createFile(page);
    await expect(page.getByTestId("file-create-dialog")).not.toBeVisible();
  }
  if (!onboarding) {
    await openFileMenu(page);
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Import list" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(join(__dirname, "..", "public/todo.txt"));
    await expect(
      page.getByRole("menu", { name: "File menu" }),
    ).not.toBeVisible();
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
  await page.getByLabel("Open file menu").click();
  await expect(page.getByRole("menu", { name: "File menu" })).toBeVisible();
}

export async function checkSearchParams(page: Page, searchParams = "") {
  await expect(page).toHaveURL(`http://localhost:5173${searchParams}`);
}

export function getEditor(page: Page) {
  return page.getByRole("textbox", { name: "Text editor" });
}
