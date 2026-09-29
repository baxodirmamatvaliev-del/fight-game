import { chromium } from "playwright";
import { access } from "node:fs/promises";
import assert from "node:assert/strict";
const url =
  process.env.TEST_URL || "https://neon-clash-fight-game.mamatvalievbobur.chatgpt.site";
let executablePath;
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
try {
  await access(chrome);
  executablePath = chrome;
} catch {}
const browser = await chromium.launch({ headless: true, executablePath });
try {
  // Deliberately fresh, anonymous context: no sign-in, no bypass token, no cookies.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  assert.equal(
    response.status(),
    200,
    "Public site should return 200 without authentication",
  );
  await page.waitForFunction(
    () => window.neonClash?.ready && neonClash.artLoaded.length === 5,
    null,
    { timeout: 90000 },
  );
  assert.equal(await page.locator("#visible-controls .control-item").count(), 7);
  await page.screenshot({ path: "test-results/public-lobby.png", fullPage: true });
  await page.locator("#selection-start").click();
  assert.equal(await page.locator("#guide-dialog").evaluate((d) => d.open), true);
  await page.locator("#guide-start").click();
  await page.waitForFunction(() => neonClash.state?.phase === "fight", null, {
    timeout: 15000,
  });
  const x = await page.evaluate(() => neonClash.state.fighters[0].x);
  await page.keyboard.down("d");
  await page.waitForTimeout(400);
  await page.keyboard.up("d");
  assert.ok((await page.evaluate(() => neonClash.state.fighters[0].x)) > x);
  assert.equal(await page.locator("#arena-controls").isVisible(), true);
  assert.equal(await page.locator("#arena-controls .control-item").count(), 7);
  await page.keyboard.press("p");
  assert.equal(await page.evaluate(() => neonClash.paused), true);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: anonymous public access, all realistic sprites, Python startup, control guide, combat input and pause.",
  );
} finally {
  await browser.close();
}
