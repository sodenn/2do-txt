import { expect, Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test("should connect with WebDAV", async ({ page }) => {
  await page.routeFromHAR("tests/webdav.har", {
    url: "**/webdav/**",
  });
  await openWebDAVDialog(page);
  await connectToWebDAV(page);
  await expect(page.getByText("Connected to WebDAV")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import todo.txt from WebDAV" })
  ).toBeVisible();
});

test("should not connect with WebDAV", async ({ page }) => {
  await openWebDAVDialog(page);
  await connectToWebDAV(page);
  await expect(page.getByText("Connection Error")).toBeVisible();
});

async function openWebDAVDialog(page: Page) {
  await page.getByRole("button", { name: "Connect to cloud storage" }).click();
  await page.getByRole("menuitem", { name: "Connect to WebDAV" }).click();
  await page.getByRole("button", { name: "Connect to WebDAV" }).click();
}

async function connectToWebDAV(page: Page) {
  await page.getByLabel("URL").fill("http://localhost:8080/remote.php/webdav");
  await page.getByLabel("URL").press("Tab");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Username").press("Tab");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Connect" }).click();
}
