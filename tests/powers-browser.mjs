import { chromium, devices } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  const page = await browser.newPage({
    ...devices["iPhone 13"],
    viewport: { width: 844, height: 390 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/vendor/pyodide/**", (r) => r.abort());
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:8000");
  await page.waitForFunction(
    () => window.neonClash?.ready && neonClash.artLoaded.length === 5,
  );
  await page.locator('[data-fighter="volt"]').tap();
  await page.locator('[data-mode="local"]').tap();
  await page.locator("#selection-start").tap();
  await page.locator("#guide-start").tap();
  await page.waitForFunction(() => neonClash.state?.phase === "fight");
  // Real touch attacks against a local second player; no application state edits.
  for (let i = 0; i < 7; i++) {
    const distance = await page.evaluate(
      () => neonClash.state.fighters[1].x - neonClash.state.fighters[0].x,
    );
    if (distance > 95) {
      await page.keyboard.down("d");
      await page.waitForTimeout(((distance - 88) / 305) * 1000);
      await page.keyboard.up("d");
    }
    await page.locator('[data-action="kick"]').tap();
    await page.waitForTimeout(650);
  }
  const hp = await page.evaluate(() => neonClash.state.fighters[1].health);
  assert.ok(hp > 0 && hp <= 20, `Finisher threshold: ${hp}`);
  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  await page.keyboard.up("d");
  await page.waitForFunction(() =>
    document
      .querySelector('[data-action="finisher"]')
      .classList.contains("power-ready"),
  );
  await page.locator('[data-action="finisher"]').tap();
  await page.waitForFunction(() => neonClash.state.fighters[0].action === "finisher");
  await page.screenshot({ path: "test-results/mobile-finisher.png" });
  await page.waitForFunction(() => neonClash.state.fighters[1].health === 0);
  assert.equal(await page.evaluate(() => neonClash.state.round_winner), 0);
  assert.deepEqual(errors, []);
  // Visual audit of every textured rig and an extended punch/kick.
  await page.evaluate(async () => {
    const { drawFighter, fighters } = await import("/js/fighters.js");
    const c = document.createElement("canvas");
    c.id = "rig-audit";
    c.width = 1500;
    c.height = 650;
    c.style =
      "position:fixed;inset:0;width:100vw;height:100vh;z-index:1000;background:#17212a";
    document.body.append(c);
    const ctx = c.getContext("2d");
    Object.keys(fighters).forEach((kind, i) => {
      for (let row = 0; row < 2; row++) {
        const f = {
          kind,
          player: `audit-${i}-${row}`,
          x: 120 + i * 290,
          y: 535,
          facing: 1,
          action: row ? "kick" : "idle",
          action_time: 0.23,
          attack_serial: 1,
        };
        ctx.save();
        ctx.translate(0, -235 + row * 320);
        drawFighter(ctx, f, 30);
        ctx.fillStyle = "#fff";
        ctx.font = "16px sans-serif";
        ctx.fillText(kind, f.x - 40, f.y + 25);
        ctx.restore();
      }
    });
  });
  await page.screenshot({ path: "test-results/rig-audit.png" });
  console.log(
    "PASS: real mobile finishing move, energy/health readiness, KO and all fighter rigs.",
  );
} finally {
  await browser.close();
}
