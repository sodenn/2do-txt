const { chromium } = require("@playwright/test");

(async () => {
  // Make sure to run headed.
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-web-security", "--disable-site-isolation-trials"],
  });
  // Setup context however you like.
  const context = await browser.newContext();
  await context.route("**/*", (route) => route.continue());
  // Pause the page, and start recording manually.
  const page = await context.newPage();
  await page.goto("http://localhost:5173");
  await page.pause();
})();
