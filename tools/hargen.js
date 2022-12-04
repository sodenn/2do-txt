const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    args: ["--disable-web-security", "--disable-site-isolation-trials"],
  });

  const context = await browser.newContext({
    recordHar: {
      path: "./webdav.har",
      urlFilter: "**/webdav/**",
      mode: "minimal",
    },
  });

  const page = await context.newPage();
  await page.goto("http://localhost:5173");

  // await page.getByRole("button", { name: "Connect to cloud storage" }).click();
  // await page.getByRole("menuitem", { name: "Connect to WebDAV" }).click();
  // await page.getByRole("button", { name: "Connect to WebDAV" }).click();
  // await page.getByLabel("URL").fill("http://localhost:8080/remote.php/webdav");
  // await page.getByLabel("URL").press("Tab");
  // await page.getByLabel("Username").fill("admin");
  // await page.getByLabel("Username").press("Tab");
  // await page.getByLabel("Password").fill("admin");
  // await page.getByRole("button", { name: "Connect" }).click();

  await new Promise((resolve) => {
    page.on("close", resolve);
    browser.on("disconnected", resolve);
  });

  await context.close();
  await browser.close();
})();
