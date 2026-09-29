import { chromium, devices } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:8000");
  await page.waitForFunction(
    () => window.neonClash?.graphics.ready || window.neonClash?.graphics.error,
  );
  assert.equal(await page.evaluate(() => neonClash.graphics.error), null);
  await page.screenshot({ path: "test-results/new-entry.png", fullPage: true });
  await page.locator("#sound-check").click();
  assert.equal(await page.evaluate(() => neonClash.audioState), "running");
  assert.equal(await page.evaluate(() => neonClash.voices.loaded), 6);
  await page.waitForFunction(() => neonClash.audioLevel > 1);
  await page.locator('[data-mode="practice"]').click();
  await page.locator("#selection-start").click();
  await page.locator("#guide-start").click();
  await page.waitForFunction(() => neonClash.state?.phase === "fight");
  await page.waitForTimeout(500);
  const graphics = await page.evaluate(() => neonClash.graphics);
  for (const actor of graphics.details.actors)
    assert.ok(
      actor.hips[1] > 100 && actor.hips[1] < 220,
      "3D skeleton must be in the visible arena",
    );
  await page.screenshot({ path: "test-results/3d-stance.png" });
  await page.keyboard.down("d");
  await page.waitForTimeout(1250);
  await page.keyboard.up("d");
  const voices = await page.evaluate(() => neonClash.voices.played);
  await page.keyboard.press("k");
  await page.waitForTimeout(230);
  await page.screenshot({ path: "test-results/3d-kick.png" });
  await page.waitForFunction((n) => neonClash.voices.played > n, voices);
  assert.equal(await page.evaluate(() => neonClash.graphics.actors), 2);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: WebGL skinned fighters, entry, decoded human voices, non-silent output and hit-triggered voice.",
  );
} finally {
  await browser.close();
}
