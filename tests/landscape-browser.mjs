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
  const context = await browser.newContext({ ...devices["iPhone 13"] }),
    page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/vendor/pyodide/**", (route) => route.abort());
  const response = await page.goto(url);
  assert.equal(response.status(), 200);
  await page.waitForFunction(
    () => window.neonClash?.ready && neonClash.artLoaded.length === 5,
  );
  await page.locator('[data-fighter="subzero"]').tap();
  await page.locator('[data-mode="practice"]').tap();
  await page.locator('[data-arena="forest"]').tap();
  await page.locator("#selection-start").tap();
  await page.locator("#guide-start").tap();
  await page.waitForFunction(() => neonClash.orientationBlocked);
  assert.equal(await page.locator("#rotate-prompt").isVisible(), true);
  const initial = await page.evaluate(() => JSON.stringify(neonClash.state.fighters));
  await page.waitForTimeout(700);
  assert.equal(
    await page.evaluate(() => JSON.stringify(neonClash.state.fighters)),
    initial,
  );
  await page.screenshot({ path: "test-results/rotate-phone.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => !neonClash.orientationBlocked);
  assert.equal(await page.locator("#rotate-prompt").isVisible(), false);
  const arena = await page.locator("#arena").boundingBox();
  assert.ok(arena.width >= 840 && arena.height >= 385);
  assert.equal(await page.locator(".topbar").isVisible(), false);
  const stick = await page.locator("#move-stick").boundingBox();
  const session = await context.newCDPSession(page);
  const point = {
    id: 0,
    x: stick.x + stick.width * 0.8,
    y: stick.y + stick.height / 2,
  };
  const before = await page.evaluate(() => neonClash.state.fighters[0].x);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  await page.waitForTimeout(1400);
  assert.ok((await page.evaluate(() => neonClash.state.fighters[0].x)) > before + 150);
  const kick = await page.locator('[data-action="kick"]').boundingBox();
  assert.ok(kick.width >= 48 && kick.height >= 48);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      point,
      { id: 1, x: kick.x + kick.width / 2, y: kick.y + kick.height / 2 },
    ],
  });
  await page.waitForFunction(() => neonClash.state.training.completed.includes("kick"));
  await page.waitForTimeout(350);
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector("#move-stick"))
        .getPropertyValue("--stick-x")
        .trim() === "0px",
  );
  assert.ok((await page.evaluate(() => neonClash.state.training.hits)) > 0);
  await page.locator('[data-action="jump"]').tap();
  await page.waitForFunction(() => neonClash.state.training.completed.includes("jump"));
  for (const name of ["punch", "block", "special"]) {
    await page.waitForTimeout(750);
    await page.locator(`[data-action="${name}"]`).tap();
    await page.waitForFunction(
      (action) => neonClash.state.training.completed.includes(action),
      name,
    );
  }
  await page.waitForTimeout(750);
  await page.screenshot({ path: "test-results/landscape-forest.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => neonClash.orientationBlocked);
  const frozen = await page.evaluate(() => JSON.stringify(neonClash.state.fighters));
  await page.waitForTimeout(700);
  assert.equal(
    await page.evaluate(() => JSON.stringify(neonClash.state.fighters)),
    frozen,
  );
  await page.locator("#rotate-menu").tap();
  assert.equal(await page.locator("#setup").isVisible(), true);
  assert.equal(
    await page.evaluate(() => document.body.classList.contains("mobile-battle")),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: portrait safety gate, full landscape arena, joystick, simultaneous movement/kick, all touch actions, rotation freeze and menu recovery.",
  );
} finally {
  await browser.close();
}
