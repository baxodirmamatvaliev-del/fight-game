import { chromium, devices } from "playwright";
import { access, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const url = process.env.TEST_URL || "http://127.0.0.1:8000";
let executablePath;
try {
  await access("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
} catch {}
const browser = await chromium.launch({ headless: true, executablePath });
await mkdir("test-results", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Prove startup and combat remain playable with all Python downloads blocked.
  await page.route("**/vendor/pyodide/**", (r) => r.abort());
  await page.goto(url);
  await page.waitForFunction(() => window.neonClash?.ready, null, { timeout: 10000 });
  await page.waitForFunction(() => neonClash.artLoaded.length === 5);
  assert.equal(await page.locator(".fighter-card").count(), 5);
  for (const kind of ["scorpion", "ghost", "ember", "volt", "subzero"]) {
    await page.locator(`[data-fighter="${kind}"]`).click();
    assert.equal(await page.evaluate(() => neonClash.options.p1), kind);
  }
  assert.equal(await page.locator("#selected-fighter-name").textContent(), "SUB-ZERO");
  const selection = await page.locator("#setup").boundingBox(),
    arena = await page.locator("#arena").boundingBox();
  assert.ok(selection.y < arena.y, "Selection must precede the fight");
  await page.screenshot({
    path: "test-results/tournament-desktop.png",
    fullPage: true,
  });
  await page.locator('[data-mode="practice"]').click();
  await page.locator("#selection-start").click();
  await page.locator("#guide-start").click();
  assert.equal(await page.evaluate(() => neonClash.backend), "lightweight");
  assert.equal(await page.locator("#setup").isVisible(), false);
  for (const [key, action] of [
    ["ArrowLeft", "punch"],
    ["ArrowRight", "kick"],
    ["ArrowUp", "special"],
    ["ArrowDown", "block"],
  ]) {
    await page.keyboard.press(key);
    await page.waitForFunction(
      (a) => neonClash.state.training.completed.includes(a),
      action,
    );
    await page.waitForTimeout(750);
  }
  const before = await page.evaluate(() => neonClash.state.fighters[0].x);
  await page.keyboard.down("d");
  await page.waitForTimeout(350);
  await page.keyboard.up("d");
  assert.ok((await page.evaluate(() => neonClash.state.fighters[0].x)) > before);
  await page.screenshot({ path: "test-results/tournament-fight.png", fullPage: true });
  assert.deepEqual(errors, []);
  const context = await browser.newContext({ ...devices["iPhone 13"] }),
    phone = await context.newPage();
  await phone.route("**/vendor/pyodide/**", (r) => r.abort());
  await phone.goto(url);
  await phone.waitForFunction(() => window.neonClash?.ready);
  await phone.locator('[data-fighter="scorpion"]').tap();
  await phone.locator('[data-mode="practice"]').tap();
  await phone.locator("#selection-start").tap();
  await phone.locator("#guide-start").tap();
  await phone.waitForTimeout(700);
  const button = phone.locator('[data-action="punch"]'),
    box = await button.boundingBox();
  assert.ok(box.height >= 48);
  assert.equal(await button.isVisible(), true);
  await button.tap();
  await phone.waitForFunction(() =>
    neonClash.state.training.completed.includes("punch"),
  );
  await phone.waitForTimeout(450);
  await phone.locator('[data-action="jump"]').tap();
  await phone.waitForFunction(() =>
    neonClash.state.training.completed.includes("jump"),
  );
  assert.equal(
    await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await phone.screenshot({
    path: "test-results/tournament-mobile.png",
    fullPage: true,
  });
  console.log(
    "PASS: fast startup without Python, all selections, arrow attacks, lightweight combat and actual mobile touch actions.",
  );
} finally {
  await browser.close();
}
