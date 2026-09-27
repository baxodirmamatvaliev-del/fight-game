import assert from "node:assert/strict";
globalThis.Image = class {};
const { FallbackEngine } = await import("../public/js/fallback-engine.js");
const { fighters } = await import("../public/js/fighters.js");
for (const kind of Object.keys(fighters)) {
  const engine = new FallbackEngine();
  let s = engine.start({p1: kind, p2:"scorpion", mode:"practice"});
  assert.equal(s.fighters[0].kind, kind);
  for (let i=0;i<35;i++) s=engine.tick(1/60, [["right"], []]);
  assert.ok(s.fighters[0].x > 362);
  s=engine.tick(1/60, [["jump"], []]); assert.ok(s.fighters[0].y<535);
  for(let i=0;i<80;i++) s=engine.tick(1/60,[[],[]]);
  assert.equal(s.fighters[0].y,535);
  engine.players[1].x=engine.players[0].x+90;
  s=engine.tick(1/60,[["punch"],[]]);
  for(let i=0;i<12;i++) s=engine.tick(1/60,[[],[]]);
  assert.ok(s.training.hits>0);
  assert.equal(s.remaining,60);
  assert.equal(s.fighters[0].health,100);
}
const game=new FallbackEngine();game.start({p1:"subzero",p2:"scorpion",mode:"local"});
for(let round=0;round<2;round++) {
  game.phase="fight";game.players[1].health=0;game.tick(1/60,[[],[]]);
  for(let i=0;i<180;i++)game.tick(1/60,[[],[]]);
}
assert.equal(game.phase,"match_over");assert.equal(game.winner,0);
const ice=new FallbackEngine();ice.start({p1:"subzero",p2:"scorpion",mode:"local"});
ice.damage(ice.players[0],ice.players[1],18,65,true);
assert.equal(ice.players[1].stun,.7);
const held=new FallbackEngine();held.start({p1:"subzero",p2:"scorpion",mode:"practice"});
for(let i=0;i<100;i++)held.tick(1/60,[["punch"],[]]);assert.equal(held.players[0].action,"idle");
console.log("PASS: all fighters, lightweight physics, damage, practice, rounds, ice stun and held-input safety.");
