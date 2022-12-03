import { expect, Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test("should connect with WebDAV", async ({ page }) => {
  await replayFromHar(page);
  await connectToWebDAV(page);
  await openWebDAVImportDialog(page);
  await expect(page.getByText("Connected to WebDAV")).toBeVisible();
});

test("should not connect with WebDAV", async ({ page }) => {
  await connectToWebDAV(page);
  await expect(page.getByText("Connection Error")).toBeVisible();
});

test("should import todo.txt from WebDAV", async ({ page }) => {
  await replayFromHar(page);
  await connectToWebDAV(page);
  await openWebDAVImportDialog(page);
  await page.getByRole("button", { name: "Documents /Documents" }).click();
  await page
    .getByRole("button", { name: "todo.txt /Documents/todo.txt" })
    .click();
  await page.getByRole("button", { name: "Import" }).click();
  await page.waitForURL("http://localhost:5173/?active=todo.txt");
  await expect(page.getByTestId("task")).toHaveCount(8);
});

test("should sync todo.txt with WebDAV", async ({ page }) => {
  await replayFromHar(page);
  await connectToWebDAV(page);
  await openWebDAVImportDialog(page);
  await page.getByRole("button", { name: "Documents /Documents" }).click();
  await page
    .getByRole("button", { name: "todo.txt /Documents/todo.txt" })
    .click();
  await page.getByRole("button", { name: "Import" }).click();
  await page.waitForSelector("text=Connected to WebDAV", { state: "hidden" });
  const taskCheckbox = page
    .getByTestId("task")
    .nth(0)
    .locator('input[type="checkbox"]');
  await taskCheckbox.click();
  await expect(page.getByText("Sync with cloud storage")).toBeVisible();
});

test("should navigate back and forward", async ({ page }) => {
  await replayFromHar(page);
  await connectToWebDAV(page);
  await openWebDAVImportDialog(page);
  await page.getByRole("button", { name: "Documents /Documents" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Documents /Documents" }).click();
  await expect(
    page.getByRole("button", { name: "todo.txt /Documents/todo.txt" })
  ).toBeVisible();
});

async function openWebDAVDialog(page: Page) {
  await page.getByRole("button", { name: "Connect to cloud storage" }).click();
  await page.getByRole("menuitem", { name: "Connect to WebDAV" }).click();
}

async function connectToWebDAV(page: Page) {
  await openWebDAVDialog(page);
  await page.getByLabel("URL").fill("http://localhost:8080/remote.php/webdav");
  await page.getByLabel("URL").press("Tab");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Username").press("Tab");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Connect" }).click();
}

async function openWebDAVImportDialog(page: Page) {
  await page
    .getByRole("button", { name: "Import todo.txt from WebDAV" })
    .click();
}

async function replayFromHar(page: Page) {
  await page.routeFromHAR("tests/webdav.har", {
    url: "**/webdav/**",
  });
}
