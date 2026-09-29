import { chromium, devices } from "playwright";
import { mkdir, access } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://127.0.0.1:8000";
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let executablePath;
try {
  await access(chrome);
  executablePath = chrome;
} catch {
  /* Use Playwright Chromium on other platforms. */
}
const browser = await chromium.launch({ headless: true, executablePath });
const errors = [];
await mkdir("test-results", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => window.neonClash?.ready, { timeout: 90000 });
  await page.waitForFunction(() => neonClash.artLoaded.length === 5);
  await page.screenshot({
    path: "test-results/desktop-lobby.png",
    fullPage: true,
  });
  assert.equal(await page.locator(".fighter-card").count(), 5);
  await page.locator('[data-fighter="ghost"]').click();
  assert.equal(await page.evaluate(() => neonClash.options.p1), "ghost");
  for (const arena of ["temple", "void", "city"]) {
    await page.locator(`[data-arena="${arena}"]`).click();
    assert.equal(await page.evaluate(() => neonClash.options.arena), arena);
  }
  await page.locator("#help-button").click();
  assert.equal(await page.locator("#help-dialog").evaluate((d) => d.open), true);
  await page.locator("#help-dialog .close-dialog").click();
  await page.locator("#settings-button").click();
  await page.locator("#music").uncheck();
  await page.locator("#settings-dialog .close-dialog").click();
  await page.locator('[data-mode="local"]').click();
  await page.locator('[data-fighter="volt"]').click();
  await page.locator("#selection-start").click();
  assert.equal(await page.locator("#guide-dialog").evaluate((d) => d.open), true);
  assert.equal(await page.locator("#guide-controls .control-item").count(), 18);
  await page.screenshot({ path: "test-results/controls-guide.png" });
  await page.locator("#guide-start").click();
  await page.waitForFunction(() => neonClash.state?.phase === "fight");
  assert.equal(await page.evaluate(() => neonClash.audioState), "running");
  const before = await page.evaluate(() => neonClash.state.fighters[0].x);
  await page.keyboard.down("d");
  await page.waitForTimeout(1250);
  await page.keyboard.up("d");
  assert.ok((await page.evaluate(() => neonClash.state.fighters[0].x)) > before + 150);
  await page.keyboard.down("l");
  await page.waitForTimeout(100);
  await page.keyboard.up("l");
  await page.waitForTimeout(1000);
  assert.ok(
    (await page.evaluate(() => neonClash.state.fighters[1].health)) < 100,
    "Python special should damage opponent: " +
      JSON.stringify(await page.evaluate(() => neonClash.state)),
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(500);
  await page.keyboard.up("d");
  let hp = await page.evaluate(() => neonClash.state.fighters[1].health);
  await page.keyboard.down("j");
  await page.waitForTimeout(100);
  await page.keyboard.up("j");
  await page.waitForTimeout(350);
  assert.ok(
    (await page.evaluate(() => neonClash.state.fighters[1].health)) < hp,
    "Melee should hit",
  );
  await page.keyboard.down("w");
  await page.waitForTimeout(170);
  assert.ok((await page.evaluate(() => neonClash.state.fighters[0].y)) < 535);
  await page.keyboard.up("w");
  await page.waitForTimeout(750);
  await page.screenshot({
    path: "test-results/desktop-fight.png",
    fullPage: true,
  });
  await page.keyboard.press("p");
  assert.equal(await page.evaluate(() => neonClash.paused), true);
  const remaining = await page.evaluate(() => neonClash.state.remaining);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => neonClash.state.remaining), remaining);
  await page.locator("#resume-button").click();
  // Exercise a real complete match through physical keyboard presses (no state mutation).
  for (let i = 0; i < 80; i++) {
    if (await page.evaluate(() => neonClash.state.phase === "match_over")) break;
    const phase = await page.evaluate(() => neonClash.state.phase);
    if (phase === "fight") {
      await page.keyboard.down("d");
      await page.waitForTimeout(170);
      await page.keyboard.up("d");
      await page.keyboard.down("k");
      await page.waitForTimeout(100);
      await page.keyboard.up("k");
      await page.waitForTimeout(550);
    } else await page.waitForTimeout(250);
  }
  assert.equal(await page.evaluate(() => neonClash.state.phase), "match_over");
  assert.equal(await page.locator("#result-screen").isVisible(), true);
  await page.screenshot({ path: "test-results/result.png" });
  await page.locator("#rematch-button").click();
  assert.equal(await page.evaluate(() => neonClash.state.wins.join(",")), "0,0");
  await page.locator("#pause-button").click();
  await page.locator("#quit-button").click();
  assert.equal(await page.locator("#setup").isVisible(), true);
  await page.reload();
  await page.waitForFunction(() => neonClash.ready, { timeout: 90000 });
  assert.equal(await page.evaluate(() => neonClash.options.mode), "local");
  const mobile = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 844, height: 390 },
  });
  const phone = await mobile.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(base);
  await phone.waitForFunction(() => neonClash?.ready, { timeout: 90000 });
  await phone.waitForFunction(() => neonClash.artLoaded.length === 5);
  assert.equal(
    await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    "Mobile layout must not overflow",
  );
  await phone.screenshot({ path: "test-results/mobile-lobby.png" });
  await phone.locator("#selection-start").tap();
  assert.equal(await phone.locator("#guide-dialog").evaluate((d) => d.open), true);
  await phone.locator("#guide-start").tap();
  await phone.waitForFunction(() => neonClash.state?.phase === "fight");
  assert.equal(
    await phone.locator("#touch-controls").isVisible(),
    true,
    JSON.stringify(
      await phone.evaluate(() => ({
        hidden: document.querySelector("#touch-controls").hidden,
        touch: navigator.maxTouchPoints,
        coarse: matchMedia("(pointer:coarse)").matches,
        phase: neonClash.state.phase,
      })),
    ),
  );
  const mb = await phone.evaluate(() => neonClash.state.fighters[0].x);
  const touch = await mobile.newCDPSession(phone);
  const box = await phone.locator("#move-stick").boundingBox();
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.8, y: box.y + box.height / 2 }],
  });
  await phone.waitForTimeout(500);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await phone.waitForFunction(
    () => document.querySelectorAll("[data-action].pressed").length === 0,
  );
  assert.ok((await phone.evaluate(() => neonClash.state.fighters[0].x)) > mb);
  assert.equal(
    await phone.evaluate(() => {
      const edge = document
        .querySelector("#touch-controls")
        .getBoundingClientRect().right;
      return [...document.querySelectorAll("[data-action]")].every(
        (button) => button.getBoundingClientRect().right <= edge,
      );
    }),
    true,
    "All mobile attack buttons must fit inside the panel",
  );
  await phone.screenshot({
    path: "test-results/mobile-fight.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: desktop, Python combat, sound, all arenas, menus, pause, full match, rematch, persistence, mobile layout and touch.",
  );
} finally {
  await browser.close();
}
