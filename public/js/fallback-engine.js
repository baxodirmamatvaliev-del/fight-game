// Lightweight offline-capable equivalent of the Python rules. Used when the
// WebAssembly runtime is unavailable; the backend never changes mid-match.
import { fighters } from "./fighters.js";
const floor = 535, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const attacks = {
  punch: { duration: .32, active: .10, end: .21, reach: 103, damage: 7, knock: 24 },
  kick: { duration: .51, active: .18, end: .32, reach: 151, damage: 12, knock: 48 },
  special: { duration: .62, active: .21, end: .28 },
};
export class FallbackEngine {
  start(options) {
    this.options = { ...options };
    this.kinds = [options.p1 in fighters ? options.p1 : "volt", options.p2 in fighters ? options.p2 : "ember"];
    this.wins = [0, 0]; this.round = 0; this.winner = null;
    this.completed = new Set(); this.hits = 0; this.cpuWait = 0; this.cpuKeys = [];
    this.newRound(); return this.snapshot();
  }
  newRound() {
    this.round++; this.remaining = 60; this.phase = this.options.mode === "practice" ? "fight" : "countdown";
    this.phase_time = 2.5; this.round_winner = null; this.projectiles = []; this.events = [];
    this.players = this.kinds.map((kind, player) => ({ kind, player, x: player ? 850 : 350, y: floor, vy: 0,
      facing: player ? -1 : 1, health: 100, energy: this.options.mode === "practice" ? 100 : 35,
      action: "idle", action_time: 0, combo: 0, combo_time: 0, stun: 0, hit_done: false,
      previous: new Set(), buffered: null, buffer_time: 0 }));
  }
  update(f, dt, keys, target) {
    const pressed = new Set([...keys].filter(k => !f.previous.has(k))); f.previous = keys;
    f.buffer_time = Math.max(0, f.buffer_time - dt); if (!f.buffer_time) f.buffered = null;
    for (const command of ["special", "kick", "punch", "jump"]) if (pressed.has(command)) {
      if (command !== "special" || f.energy >= 35) { f.buffered = command; f.buffer_time = .18; } break;
    }
    f.energy = Math.min(100, f.energy + dt * 4); f.stun = Math.max(0, f.stun - dt);
    f.combo_time = Math.max(0, f.combo_time - dt); if (!f.combo_time) f.combo = 0;
    if (attacks[f.action]) { f.action_time += dt; if (f.action_time >= attacks[f.action].duration) f.action = "idle"; }
    else f.facing = target.x >= f.x ? 1 : -1;
    const grounded = f.y >= floor;
    if (f.health <= 0) { f.action = "ko"; f.buffered = null; }
    else if (f.stun) f.action = "hurt";
    else if (!attacks[f.action]) {
      f.action = keys.has("block") && grounded ? "block" : "idle";
      if (f.action !== "block") {
        const direction = Number(keys.has("right")) - Number(keys.has("left"));
        f.x += direction * (fighters[f.kind].moveSpeed || 305) * dt; if (direction) f.action = "walk";
        if (f.buffered === "jump" && grounded) { f.vy = -780; f.buffered = null; f.buffer_time = 0; }
        if (attacks[f.buffered] && (f.buffered !== "special" || f.energy >= 35)) {
          f.action = f.buffered; f.buffered = null; f.buffer_time = 0; f.action_time = 0; f.hit_done = false;
          if (f.action === "special") f.energy -= 35;
        }
      }
    }
    f.vy += 1900 * dt; f.y = Math.min(floor, f.y + f.vy * dt); if (f.y >= floor) f.vy = 0;
    f.x = clamp(f.x, 65, 1135);
  }
  damage(a, b, amount, knock, special = false) {
    const blocked = b.action === "block" && (a.x - b.x) * b.facing > 0;
    const dealt = amount * (fighters[a.kind].damageScale || 1) * (blocked ? .12 : 1);
    const damage = Math.min(b.health, dealt); b.health = Math.max(0, b.health - dealt);
    b.x = clamp(b.x + knock * (b.x >= a.x ? 1 : -1) * (blocked ? .35 : 1), 65, 1135);
    b.energy = Math.min(100, b.energy + (blocked ? 7 : 5)); a.energy = Math.min(100, a.energy + (blocked ? 3 : 8));
    if (!blocked) { b.stun = special && fighters[a.kind].element === "ice" ? .7 : special ? .23 : .17; b.action = "hurt"; a.combo++; a.combo_time = 1.25; }
    this.events.push({ type: blocked ? "block" : "hit", x: b.x, y: b.y - 155, color: fighters[a.kind].color,
      special, combo: a.combo, damage: Math.round(damage * 100) / 100, player: a.player });
  }
  cpu(dt) {
    this.cpuWait -= dt; if (this.cpuWait > 0) return this.cpuKeys;
    const [a, b] = this.players, level = this.options.difficulty;
    this.cpuWait = (level === "easy" ? .42 : level === "hard" ? .12 : .23) * (.7 + Math.random() * .6);
    const distance = Math.abs(a.x - b.x), aggression = level === "easy" ? .48 : level === "hard" ? .9 : .7;
    const threat = (attacks[a.action] && distance < 160) || this.projectiles.some(p => !p.owner && Math.abs(p.x - b.x) < 250);
    this.cpuKeys = [];
    if (threat && Math.random() < aggression) this.cpuKeys = ["block"];
    else if (distance > 125) {
      this.cpuKeys = [a.x > b.x ? "right" : "left"];
      if (b.energy >= 35 && Math.random() < .3) this.cpuKeys.push("special");
      else if (Math.random() < .13) this.cpuKeys.push("jump");
    } else if (Math.random() < aggression) this.cpuKeys = [Math.random() < .34 ? "punch" : "kick"];
    return this.cpuKeys;
  }
  tick(dt, inputs) {
    dt = clamp(dt, 0, 1/30); this.events = [];
    if (this.phase === "match_over") return this.snapshot();
    if (this.phase !== "fight") {
      this.phase_time -= dt;
      if (this.phase_time <= 0) {
        if (this.phase === "countdown") { this.phase = "fight"; this.events.push({type: "fight"}); }
        else if (Math.max(...this.wins) >= 2) { this.phase = "match_over"; this.winner = this.wins[0] >= 2 ? 0 : 1; this.events.push({type: "victory", player: this.winner}); }
        else this.newRound();
      }
      return this.snapshot();
    }
    const [a, b] = this.players, practice = this.options.mode === "practice";
    const keys = [inputs[0] || [], practice ? [] : this.options.mode === "cpu" ? this.cpu(dt) : inputs[1] || []];
    if (practice) { a.energy = 100; if (b.health <= 0) { b.health = 100; b.action = "idle"; b.stun = 0; } else b.health = Math.min(100, b.health + dt * 18); }
    else this.remaining = Math.max(0, this.remaining - dt);
    this.players.forEach((f, i) => this.update(f, dt, new Set(keys[i]), this.players[1-i]));
    if (Math.abs(a.y-b.y) < 130 && Math.abs(a.x-b.x) < 74) {
      const direction = b.x >= a.x ? 1 : -1, overlap = (74 - Math.abs(a.x-b.x)) / 2;
      a.x = clamp(a.x-overlap*direction,65,1135); b.x = clamp(b.x+overlap*direction,65,1135);
    }
    for (const f of this.players) {
      const target = this.players[1-f.player], attack = attacks[f.action];
      if (!attack || f.hit_done) continue;
      if (f.action === "special" && f.action_time >= attack.active) {
        f.hit_done = true; this.projectiles.push({ x: f.x + f.facing * 70, y: f.y-155, direction: f.facing, owner: f.player, color: fighters[f.kind].color, element: fighters[f.kind].element || "energy" });
        this.events.push({type: "special", x: f.x, y: f.y-155, color: fighters[f.kind].color});
      } else if (f.action !== "special" && f.action_time >= attack.active && f.action_time <= attack.end) {
        const dx = (target.x-f.x)*f.facing;
        if (dx >= 0 && dx <= attack.reach && Math.abs(f.y-target.y)<95) { f.hit_done = true; this.damage(f,target,attack.damage,attack.knock); }
      }
    }
    this.projectiles = this.projectiles.filter(p => {
      const before = p.x; p.x += p.direction*740*dt; const target = this.players[1-p.owner];
      if (target.x >= Math.min(before,p.x)-35 && target.x <= Math.max(before,p.x)+35 && p.y >= target.y-170 && p.y <= target.y-20) {
        this.damage(this.players[p.owner],target,18,65,true); return false;
      } return p.x >= -60 && p.x <= 1260;
    });
    if (practice) {
      if (a.x < 338) this.completed.add("left"); if (a.x > 362) this.completed.add("right"); if (a.y < floor-15) this.completed.add("jump");
      if (["block","punch","kick","special"].includes(a.action)) this.completed.add(a.action);
      this.hits += this.events.filter(e=>e.type === "hit" && e.player === 0).length;
    } else if (Math.min(a.health,b.health)<=0 || this.remaining<=0) {
      if (Math.abs(a.health-b.health)>.001) { this.round_winner = a.health>b.health ? 0 : 1; this.wins[this.round_winner]++; }
      this.phase = "round_over"; this.phase_time = 2.8;
      for (const f of this.players) if (f.health<=0) f.action="ko";
      this.events.push({type:"ko",player:this.round_winner});
    }
    return this.snapshot();
  }
  snapshot() {
    return {fighters: this.players.map(({previous, buffered, buffer_time, ...f})=>({...f})), projectiles: this.projectiles.map(p=>({...p})),
      phase:this.phase, phase_time:this.phase_time, round:this.round, remaining:this.remaining, wins:[...this.wins],
      winner:this.winner, round_winner:this.round_winner, events:this.events.map(e=>({...e})),
      training:this.options.mode === "practice" ? {completed:[...this.completed].sort(),hits:this.hits} : null};
  }
}
