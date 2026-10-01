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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  await page.locator("[data-action=enter]").waitFor();
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/title.png" });
  const ticks = await page.evaluate(() => fightCore.world.ticks);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => fightCore.world.ticks), ticks);
  await page.locator("[data-action=enter]").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/main-menu.png" });
  await page.locator("[data-action=settings]").click();
  await page.locator("#mute").focus();
  await page.keyboard.press("Space");
  assert.equal(
    await page.locator("#mute").isChecked(),
    true,
    "Space toggles focused menu checkbox",
  );
  assert.equal(await page.evaluate(() => fightCore.audio.muted), true);
  assert.equal(
    await page.evaluate(() => fightCore.controls.sample().block),
    false,
    "menu input never enters combat",
  );
  await page.keyboard.press("Space");
  assert.equal(await page.evaluate(() => fightCore.audio.muted), false);
  await page.locator("#volume").fill("30");
  assert.equal(await page.evaluate(() => fightCore.audio.volume), 0.3);
  await page.locator("#motion").check();
  assert.ok(await page.evaluate(() => fightCore.menu.reduceMotion));
  await page.locator(".dialog [data-action=back]").click();
  await page.locator("[data-action=versus]").click();
  await page.locator('[data-fighter="2"]').hover();
  assert.equal(await page.locator("#fighter-name").textContent(), "WRAITH");
  await page.locator('[data-fighter="2"]').click();
  await page.locator("[data-action=confirm]").click();
  await page.locator('[data-fighter="4"]').click();
  await page.screenshot({ path: "test-results/character-select.png" });
  await page.locator("[data-action=confirm]").click();
  await page.screenshot({ path: "test-results/vs-intro.png" });
  await page.locator("[data-action=fight]").click();
  await page.waitForFunction(() => fightCore.world.ticks > 3);
  assert.deepEqual(await page.evaluate(() => fightCore.selection), [2, 4]);
  const x = await page.evaluate(() => fightCore.world.dummy.x);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(200);
  await page.keyboard.up("ArrowRight");
  assert.ok((await page.evaluate(() => fightCore.world.dummy.x)) > x);
  await page.keyboard.press("Escape");
  await page.locator("[data-action=resume]").waitFor();
  const paused = await page.evaluate(() => fightCore.world.remaining);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => fightCore.world.remaining), paused);
  await page.locator("[data-action=moves]").click();
  assert.ok(await page.locator("table").isVisible());
  await page.screenshot({ path: "test-results/move-list.png" });
  await page.keyboard.press("Escape");
  await page.locator("[data-action=quit]").click();
  await page.locator("[data-action=training]").click();
  await page.locator("[data-action=confirm]").click();
  await page.locator("[data-action=confirm]").click();
  await page.locator("[data-action=fight]").click();
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => fightCore.world.remaining), 3600);
  assert.equal(await page.evaluate(() => fightCore.world.player.meter), 100);
  await page.keyboard.press("Escape");
  await page.locator("[data-action=quit]").click();
  await page.locator("[data-action=arcade]").click();
  await page.locator("[data-action=confirm]").click();
  await page.locator("[data-action=confirm]").click();
  await page.locator("[data-action=fight]").click();
  const cpuX = await page.evaluate(() => fightCore.world.dummy.x);
  await page.waitForTimeout(350);
  assert.ok((await page.evaluate(() => fightCore.world.dummy.x)) < cpuX);
  assert.deepEqual(errors, []);
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await phone.goto("http://127.0.0.1:5173");
  await phone.locator("[data-action=enter]").tap();
  await phone.locator("[data-action=training]").tap();
  await phone.locator('[data-fighter="5"]').tap();
  assert.equal(await phone.locator("#fighter-name").textContent(), "IRON");
  await phone.locator("[data-action=confirm]").tap();
  await phone.locator("[data-action=confirm]").tap();
  assert.ok(await phone.locator("[data-action=fight]").isVisible());
  assert.ok(
    await phone.evaluate(
      () => document.querySelector("#menus").scrollWidth <= innerWidth,
    ),
  );
  await phone.screenshot({ path: "test-results/mobile-menu.png", fullPage: true });
  console.log(
    "PASS: menus, hover/tap selection, VS, P2 controls, pause freeze, move list, saved settings, training, CPU arcade and mobile layout.",
  );
} finally {
  await browser.close();
}
