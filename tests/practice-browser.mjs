import { chromium, devices } from "playwright";
import { access, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const url = process.env.TEST_URL || "http://127.0.0.1:8000";
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let executablePath;
try {
  await access(chrome);
  executablePath = chrome;
} catch {}
const browser = await chromium.launch({ headless: true, executablePath });
await mkdir("test-results", { recursive: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(
    () => window.neonClash?.ready && neonClash.artLoaded.length === 5,
    null,
    { timeout: 90000 },
  );
  await page.locator("#selection-start").click();
  await page.locator("#guide-practice").click();
  await page.waitForFunction(
    () => neonClash.state?.training !== null && neonClash.options.mode === "practice",
  );
  assert.equal(await page.locator("#training-panel").isVisible(), true);
  assert.equal(await page.locator(".hud-timer").textContent(), "∞");
  const initialTimer = await page.evaluate(() => neonClash.state.remaining),
    initialHealth = await page.evaluate(() => neonClash.state.fighters[0].health);
  for (const [key, ms] of [
    ["a", 220],
    ["d", 700],
    ["w", 100],
    ["s", 150],
    ["j", 100],
    ["k", 100],
    ["l", 100],
  ]) {
    if (key === "s") await page.waitForTimeout(850);
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
    await page.waitForTimeout(650);
  }
  assert.equal(await page.evaluate(() => neonClash.state.training.completed.length), 7);
  assert.equal(await page.locator(".training-step.done").count(), 7);
  assert.equal(await page.evaluate(() => neonClash.state.remaining), initialTimer);
  assert.equal(
    await page.evaluate(() => neonClash.state.fighters[0].health),
    initialHealth,
  );
  await page.keyboard.down("d");
  await page.waitForFunction(
    () => Math.abs(neonClash.state.fighters[1].x - neonClash.state.fighters[0].x) < 95,
  );
  await page.keyboard.up("d");
  await page.keyboard.press("j");
  await page.waitForTimeout(400);
  assert.ok((await page.evaluate(() => neonClash.state.training.hits)) > 0);
  await page.screenshot({
    path: "test-results/training-complete.png",
    fullPage: true,
  });
  await page.locator("#training-reset").click();
  assert.equal(await page.evaluate(() => neonClash.state.training.completed.length), 0);
  assert.equal(await page.locator("#stat-matches").textContent(), "00");
  await page.locator("#training-fight").click();
  assert.equal(await page.evaluate(() => neonClash.options.mode), "cpu");
  assert.equal(await page.locator("#guide-dialog").evaluate((d) => d.open), true);
  assert.equal(await page.locator("#training-panel").isVisible(), false);
  await page.locator("#guide-start").click();
  await page.waitForFunction(() => neonClash.state?.phase === "fight");
  assert.equal(await page.evaluate(() => neonClash.state.training), null);
  const context = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 844, height: 390 },
    }),
    phone = await context.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(url);
  await phone.waitForFunction(() => neonClash?.ready, null, { timeout: 90000 });
  await phone.locator('[data-mode="practice"]').tap();
  await phone.locator("#selection-start").tap();
  await phone.locator("#guide-start").tap();
  assert.equal(await phone.locator("#touch-controls").isVisible(), true);
  assert.equal(
    await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await phone.screenshot({
    path: "test-results/mobile-training.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: practice onboarding, all seven real actions, stationary dummy, frozen timer, unlimited energy, hit counter, reset, statistics exclusion, CPU transition and mobile layout.",
  );
} finally {
  await browser.close();
}
