import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "darwin"
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }
    : {}),
});
try {
  const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  await page.locator("[data-action=enter]").tap();
  await page.locator("[data-action=training]").tap();
  await page.locator("[data-action=confirm]").tap();
  await page.locator("[data-action=confirm]").tap();
  await page.locator("[data-action=fight]").tap();
  await page.locator("#joystick").waitFor({ state: "visible" });
  const cdp = await page.context().newCDPSession(page);
  const dispatch = (type, points) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: points.map((p) => ({ ...p, radiusX: 6, radiusY: 6, force: 1 })),
    });
  const center = async (selector) => {
    const r = await page.locator(selector).boundingBox();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const stick = await center("#joystick");
  const left = { id: 1, x: stick.x - 36, y: stick.y };
  const x = await page.evaluate(() => fightCore.world.player.x);
  await dispatch("touchStart", [left]);
  await page.waitForTimeout(150);
  assert.ok((await page.evaluate(() => fightCore.world.player.x)) < x);
  const jump = { id: 2, ...(await center("[data-touch=jump]")) };
  await dispatch("touchStart", [left, jump]);
  await page.waitForTimeout(100);
  assert.ok(
    (await page.evaluate(() => fightCore.world.player.y)) < 430,
    "jump and move together",
  );
  await dispatch("touchEnd", []);
  await page.waitForTimeout(900);
  const setup = async () => {
    await page.keyboard.press("KeyR");
    await page.waitForTimeout(70);
    await page.evaluate(() => {
      fightCore.world.player.x = 400;
      fightCore.world.dummy.x = 470;
    });
  };
  await setup();
  const right = { id: 1, x: stick.x + 36, y: stick.y };
  const punch = { id: 2, ...(await center("[data-touch=punch]")) };
  await dispatch("touchStart", [right, punch]);
  await page.waitForFunction(() => fightCore.world.dummy.health === 92);
  await page.waitForTimeout(400);
  assert.equal(
    await page.evaluate(() => fightCore.world.dummy.health),
    92,
    "held touch does not repeat",
  );
  await dispatch("touchEnd", []);
  await setup();
  await page.locator("[data-touch=kick]").tap();
  await page.waitForFunction(() => fightCore.world.dummy.health === 86);
  await setup();
  await page.locator("[data-touch=special]").tap();
  await page.waitForFunction(() => fightCore.world.dummy.health === 82);
  await setup();
  const block = { id: 1, ...(await center("[data-touch=block]")) };
  await dispatch("touchStart", [block]);
  await page.keyboard.press("KeyT");
  await page.waitForFunction(() => fightCore.world.lastHit === "BLOCK");
  assert.equal(await page.evaluate(() => fightCore.world.player.health), 100);
  await dispatch("touchCancel", []);
  await page.waitForFunction(
    () =>
      fightCore.world.player.machine.state !== "block" &&
      fightCore.world.player.machine.state !== "blockstun",
  );
  await setup();
  await page.locator("[data-touch=super]").tap();
  await page.waitForFunction(() => fightCore.world.dummy.health === 68);
  await dispatch("touchStart", [right]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#rotate-overlay").waitFor({ state: "visible" });
  const ticks = await page.evaluate(() => fightCore.world.ticks);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => fightCore.world.ticks), ticks);
  await dispatch("touchCancel", []);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => fightCore.touch.sample().axis), 0);
  await page.waitForFunction(
    () =>
      document.querySelector("#game canvas").getBoundingClientRect().height >=
      innerHeight * 0.9,
  );
  const rect = await page.locator("#game canvas").boundingBox();
  assert.ok(Math.abs(rect.width / rect.height - 16 / 9) < 0.02);
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.querySelector("#touch-controls")).touchAction,
    ),
    "none",
  );
  await page.locator("[data-action=pause]").tap();
  assert.equal(await page.locator("#touch-controls").isVisible(), false);
  await page.locator("[data-action=resume]").tap();
  assert.equal(await page.locator("#touch-controls").isVisible(), true);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/touch-landscape.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real multi-touch movement/jump/attacks, block hold/cancel, special/super, rotation freeze/clear, pause/resume and 16:9 fit.",
  );
} finally {
  await browser.close();
}
