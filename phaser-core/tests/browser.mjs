import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : process.platform === "darwin"
      ? {
          executablePath:
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        }
      : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/?arena=1");
  await page.waitForFunction(() => window.fightCore?.world.ticks > 2);
  await page.mouse.click(600, 350);
  await page.waitForFunction(() => fightCore.audio.context?.state === "running");
  assert.equal(await page.evaluate(() => fightCore.audio.played.round), 1);
  await page.waitForFunction(() => {
    const a = fightCore.audio.analyser,
      b = new Uint8Array(a.fftSize);
    a.getByteTimeDomainData(b);
    return b.some((v) => Math.abs(v - 128) > 1);
  });
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  assert.ok(await page.evaluate(() => fightCore.world.player.x > 400));
  await page.keyboard.down("KeyJ");
  await page.waitForTimeout(800);
  assert.equal(
    await page.evaluate(() => fightCore.world.dummy.health),
    92,
    "held punch hits only once",
  );
  await page.keyboard.up("KeyJ");
  assert.equal(await page.evaluate(() => fightCore.audio.played.punch), 1);
  assert.equal(await page.evaluate(() => fightCore.audio.played.dummyGrunt), 1);
  assert.ok(await page.evaluate(() => fightCore.audio.played.whoosh >= 1));
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(150);
  assert.ok(await page.evaluate(() => fightCore.world.player.y < 400));
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(800);
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(70);
  assert.equal(
    await page.evaluate(() => fightCore.world.player.machine.state),
    "crouch",
  );
  await page.keyboard.up("KeyS");
  await page.keyboard.down("Space");
  await page.waitForTimeout(70);
  assert.equal(
    await page.evaluate(() => fightCore.world.player.machine.state),
    "block",
  );
  await page.keyboard.up("Space");
  await page.keyboard.press("KeyB");
  await page.waitForTimeout(70);
  assert.equal(await page.evaluate(() => fightCore.world.dummyBlocks), true);
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(70);
  assert.equal(await page.evaluate(() => fightCore.world.dummy.health), 100);
  // Exercise actual keyboard attacks and defense in repeatable close-range setups.
  const resetClose = async () => {
    await page.keyboard.press("KeyR");
    await page.waitForTimeout(70);
    await page.evaluate(() => {
      fightCore.world.player.x = 400;
      fightCore.world.dummy.x = 470;
    });
  };
  await resetClose();
  await page.keyboard.press("KeyK");
  await page.waitForFunction(() => fightCore.world.dummy.health === 86);
  await resetClose();
  await page.keyboard.down("Space");
  await page.keyboard.press("KeyT");
  await page.waitForFunction(() => fightCore.world.lastHit === "BLOCK");
  assert.equal(await page.evaluate(() => fightCore.world.player.health), 100);
  await page.keyboard.up("Space");
  await resetClose();
  await page.evaluate(() => {
    fightCore.world.dummy.health = 8;
  });
  await page.keyboard.press("KeyJ");
  await page.waitForFunction(() => fightCore.world.result === "PLAYER WINS");
  assert.ok(await page.evaluate(() => fightCore.audio.played.flawless >= 1));
  assert.ok(await page.evaluate(() => fightCore.slowRemaining > 0));
  await page.waitForTimeout(300);
  assert.ok(
    await page.evaluate(() => Number(fightCore.views[1].sprite.frame.name) >= 88),
  );
  const ended = await page.evaluate(() => fightCore.world.remaining);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => fightCore.world.remaining), ended);
  await resetClose();
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(40);
  await page.keyboard.up("KeyS");
  await page.keyboard.down("KeyD");
  await page.keyboard.press("KeyJ");
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() => fightCore.world.dummy.health === 82);
  assert.ok(await page.evaluate(() => fightCore.audio.played.special >= 1));
  assert.ok(await page.evaluate(() => fightCore.sparks.length > 0));
  assert.equal(
    await page.evaluate(() => fightCore.world.dummy.machine.state),
    "knockdown",
  );
  await page.waitForFunction(() => fightCore.world.dummy.machine.state === "getup");
  await page.waitForFunction(() => fightCore.world.dummy.machine.state === "idle");
  await resetClose();
  await page.evaluate(() => {
    fightCore.world.player.meter = 100;
  });
  await page.keyboard.press("KeyL");
  await page.waitForFunction(() => fightCore.world.dummy.health === 68);
  assert.ok(await page.evaluate(() => fightCore.audio.played.super >= 1));
  assert.equal(await page.evaluate(() => fightCore.world.player.meter), 16);
  await resetClose();
  await page.evaluate(() => {
    fightCore.world.remaining = 2;
  });
  await page.waitForFunction(() => fightCore.world.result === "DRAW");
  await resetClose();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForFunction(() => fightCore.audio.context.state === "suspended");
  await page.keyboard.up("KeyD");
  assert.equal(
    await page.evaluate(() => fightCore.controls.sample().axis),
    0,
    "blur clears held keys",
  );
  const paused = await page.evaluate(() => fightCore.world.remaining);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => fightCore.world.remaining), paused);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.waitForFunction(
    (remaining) => fightCore.world.remaining < remaining,
    paused,
  );
  const canvas = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    canvas.x + (800 * canvas.width) / 960,
    canvas.y + (27 * canvas.height) / 540,
  );
  await page.waitForFunction(() => fightCore.audio.context.state === "running");
  assert.equal(
    await page.evaluate(() => fightCore.audio.muted),
    false,
    "SOUND resumes suspended audio without muting",
  );
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/core.png" });
  assert.deepEqual(errors, []);
  const mobile = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await mobile.newPage();
  await phone.goto("http://127.0.0.1:5173/?arena=1");
  await phone.waitForFunction(() => window.fightCore?.audio);
  assert.equal(await phone.evaluate(() => fightCore.audio.context), null);
  await phone.touchscreen.tap(420, 200);
  await phone.waitForFunction(() => fightCore.audio.context?.state === "running");
  assert.equal(await phone.evaluate(() => fightCore.audio.played.round), 1);
  await phone.evaluate(() => {
    fightCore.audio.health(100, 20, "");
    fightCore.audio.health(100, 20, "");
  });
  assert.equal(await phone.evaluate(() => fightCore.audio.played.finish), 1);
  await phone.evaluate(() => fightCore.audio.setMuted(true));
  const count = await phone.evaluate(() => fightCore.audio.played.punch || 0);
  await phone.evaluate(() => fightCore.audio.play("punch"));
  assert.equal(await phone.evaluate(() => fightCore.audio.played.punch || 0), count);
  await phone.evaluate(() => {
    fightCore.audio.setMuted(false);
    fightCore.audio.play("playerGrunt");
  });
  assert.equal(await phone.evaluate(() => fightCore.audio.played.playerGrunt), 1);
  await mobile.close();
  console.log(
    "PASS: Phaser boot, movement, held-input safety, jump, crouch, kick, actual block, dummy guard, KO, timeout, reset, focus pause/resume; no browser errors.",
  );
} finally {
  await browser.close();
}
