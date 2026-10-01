import { test } from "node:test";
import assert from "node:assert/strict";
import { FightWorld } from "../src/FightWorld.ts";
import { neutral } from "../src/InputManager.ts";
import { MotionInput } from "../src/MotionInput.ts";
import { SparkPool } from "../src/SparkPool.ts";
test("spark pool reuses objects, expires and clears without growth", () => {
  const p = new SparkPool(3),
    original = [...p.items];
  for (let i = 0; i < 100; i++) p.spawn({ x: i, y: 1, blocked: false });
  assert.equal(p.length, 3);
  assert.equal(p.items.length, 3);
  p.items.forEach((item, i) => assert.equal(item, original[i]));
  p.update(240);
  assert.equal(p.length, 0);
  p.spawn({ x: 0, y: 0, blocked: true });
  p.clear();
  assert.equal(p.length, 0);
});
test("touch special follows the same attack rules as motion input", () => {
  const w = close();
  w.step({ ...neutral(), special: true });
  assert.equal(w.player.attack, "special");
  advance(w, 10);
  assert.equal(w.dummy.health, 82);
});
test("special sequence respects facing, expiration and one-shot consumption", () => {
  for (const facing of [1, -1]) {
    const m = new MotionInput();
    m.sample({ ...neutral(), crouch: true }, facing);
    assert.equal(m.sample({ ...neutral(), axis: facing, punch: true }, facing), true);
    assert.equal(m.sample({ ...neutral(), axis: facing, punch: true }, facing), false);
  }
  const m = new MotionInput();
  m.sample({ ...neutral(), crouch: true }, 1);
  for (let i = 0; i < 20; i++) m.sample(neutral(), 1);
  assert.equal(m.sample({ ...neutral(), axis: 1, punch: true }, 1), false);
});
test("special knocks down, prevents grounded hits, then gets up", () => {
  const w = close();
  w.step({ ...neutral(), crouch: true });
  w.step({ ...neutral(), axis: 1, punch: true });
  assert.equal(w.player.attack, "special");
  advance(w, 10);
  assert.equal(w.dummy.health, 82);
  assert.equal(w.dummy.machine.state, "knockdown");
  advance(w, 10 + 36);
  assert.equal(w.dummy.machine.state, "getup");
  advance(w, 24);
  assert.equal(w.dummy.machine.state, "idle");
});
test("super requires and spends a full meter, hits once", () => {
  const w = close();
  w.step({ ...neutral(), super: true });
  assert.equal(w.player.attack, null);
  w.player.meter = 100;
  w.step({ ...neutral(), super: true });
  assert.equal(w.player.meter, 0);
  assert.equal(w.player.attack, "super");
  advance(w, 15);
  assert.equal(w.dummy.health, 68);
  advance(w, 90);
  assert.equal(w.dummy.health, 68);
  assert.equal(w.player.meter, 16);
});
test("confirmed punch cancels into kick for a true two-hit combo", () => {
  const w = close();
  w.step({ ...neutral(), punch: true });
  advance(w, 12);
  w.step({ ...neutral(), kick: true });
  advance(w, 12);
  assert.equal(w.dummy.health, 78);
  assert.equal(w.player.combo, 2);
  assert.equal(w.player.comboDamage, 22);
  assert.equal(w.player.meter, 32);
});
test("blocked special does not knock down or count as combo", () => {
  const w = close();
  w.dummyBlocks = true;
  w.step({ ...neutral(), crouch: true });
  w.step({ ...neutral(), axis: 1, punch: true });
  advance(w, 10);
  assert.equal(w.dummy.health, 100);
  assert.equal(w.dummy.machine.state, "blockstun");
  assert.equal(w.player.combo, 0);
  assert.equal(w.player.meter, 4);
});
test("contact keeps the active hitbox visible throughout hitstop", () => {
  const w = new FightWorld();
  w.player.x = 400;
  w.dummy.x = 470;
  w.step({ ...neutral(), punch: true });
  for (let i = 0; i < 6; i++) w.step(neutral());
  assert.equal(w.dummy.health, 92);
  assert.ok(w.player.hitbox, "contact pose must remain visible");
  const box = { ...w.player.hitbox };
  for (let i = 0; i < 6; i++) {
    w.step(neutral());
    assert.deepEqual(w.player.hitbox, box);
    assert.equal(w.dummy.health, 92);
  }
  for (let i = 0; i < 30; i++) w.step(neutral());
  assert.equal(w.dummy.health, 92);
  assert.equal(w.player.hitbox, null);
});
const advance = (w: FightWorld, frames: number, input = neutral()) => {
  for (let i = 0; i < frames; i++) w.step(input);
};
const close = () => {
  const w = new FightWorld();
  w.player.x = 400;
  w.dummy.x = 470;
  return w;
};
test("movement is fixed-step and respects arena boundaries", () => {
  const w = new FightWorld();
  advance(w, 60, { ...neutral(), axis: -1 });
  assert.equal(w.player.x, 100);
  advance(w, 100, { ...neutral(), axis: -1 });
  assert.equal(w.player.x, 24);
});
test("jump lands and crouch shrinks hurtbox", () => {
  const w = new FightWorld();
  w.step({ ...neutral(), jump: true });
  assert.ok(w.player.y < 430);
  advance(w, 60);
  assert.equal(w.player.y, 430);
  w.step({ ...neutral(), crouch: true });
  assert.equal(w.player.hurtbox.height, 66);
  w.step(neutral());
  assert.equal(w.player.hurtbox.height, 112);
});
test("punch startup, single damage, hitstop, then knockback", () => {
  const w = close();
  w.step({ ...neutral(), punch: true });
  advance(w, 5);
  assert.equal(w.dummy.health, 100);
  advance(w, 1);
  assert.equal(w.dummy.health, 92);
  assert.equal(w.hitstop, 6);
  const x = w.dummy.x,
    t = w.remaining;
  advance(w, 6);
  assert.equal(w.dummy.x, x);
  assert.equal(w.remaining, t);
  advance(w, 1);
  assert.ok(w.dummy.x > x);
  advance(w, 50);
  assert.equal(w.dummy.health, 92);
});
test("kick deals configured damage", () => {
  const w = close();
  w.step({ ...neutral(), kick: true });
  advance(w, 12);
  assert.equal(w.dummy.health, 86);
});
test("front block prevents damage and gets blockstun", () => {
  const w = close();
  w.dummyBlocks = true;
  w.step({ ...neutral(), punch: true });
  advance(w, 6);
  assert.equal(w.dummy.health, 100);
  assert.equal(w.dummy.machine.state, "blockstun");
});
test("player can block the dummy punch", () => {
  const w = close();
  w.step({ ...neutral(), block: true }, { ...neutral(), punch: true });
  advance(w, 6, { ...neutral(), block: true });
  assert.equal(w.player.health, 100);
  assert.equal(w.player.machine.state, "blockstun");
});
test("crouch avoids high punch but not low kick", () => {
  const w = close();
  w.step({ ...neutral(), crouch: true }, { ...neutral(), punch: true });
  advance(w, 37, { ...neutral(), crouch: true });
  assert.equal(w.player.health, 100);
  w.step({ ...neutral(), crouch: true }, { ...neutral(), kick: true });
  advance(w, 12, { ...neutral(), crouch: true });
  assert.equal(w.player.health, 86);
});
test("out-of-range attack misses", () => {
  const w = new FightWorld();
  w.step({ ...neutral(), kick: true });
  advance(w, 40);
  assert.equal(w.dummy.health, 100);
});
test("simultaneous attacks trade and cancel both attacks", () => {
  const w = close();
  w.step({ ...neutral(), punch: true }, { ...neutral(), punch: true });
  advance(w, 6);
  assert.equal(w.player.health, 92);
  assert.equal(w.dummy.health, 92);
  assert.equal(w.player.attack, null);
  assert.equal(w.dummy.attack, null);
});
test("bodies do not cross or push outside wall", () => {
  const w = close();
  w.dummy.x = 936;
  w.player.x = 880;
  advance(w, 100, { ...neutral(), axis: 1 });
  assert.equal(w.dummy.x, 936);
  assert.ok(w.player.x <= 888);
});
test("KO ends round and freezes state", () => {
  const w = close();
  w.dummy.health = 8;
  w.step({ ...neutral(), punch: true });
  advance(w, 6);
  assert.equal(w.dummy.health, 0);
  assert.equal(w.result, "PLAYER WINS");
  const x = w.player.x;
  advance(w, 60, { ...neutral(), axis: -1 });
  assert.equal(w.player.x, x);
});
test("timer expires after 3600 active ticks", () => {
  const w = new FightWorld();
  advance(w, 3600);
  assert.equal(w.remaining, 0);
  assert.equal(w.result, "DRAW");
});
