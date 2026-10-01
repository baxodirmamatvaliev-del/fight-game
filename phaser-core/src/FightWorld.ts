import { config, type AttackName } from "./config";
import { Fighter, overlaps } from "./Fighter";
import { neutral, type FightInput } from "./InputManager";
export class FightWorld {
  player = new Fighter(340);
  dummy = new Fighter(530);
  remaining = config.roundFrames;
  hitstop = 0;
  ticks = 0;
  result = "";
  lastHit = "";
  dummyBlocks = false;
  events: {
    x: number;
    y: number;
    blocked: boolean;
    final: boolean;
    attack: AttackName;
    victim: "player" | "dummy";
  }[] = [];
  constructor() {
    this.dummy.facing = -1;
  }
  step(input: FightInput, dummyInput = neutral()) {
    this.events = [];
    this.ticks++;
    if (this.result) return;
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    this.player.step(input, this.dummy.x);
    this.dummy.step(
      { ...dummyInput, block: dummyInput.block || this.dummyBlocks },
      this.player.x,
    );
    // Body separation only while hurtboxes overlap: jump-over is allowed.
    if (overlaps(this.player.hurtbox, this.dummy.hurtbox)) {
      const left = this.player.x <= this.dummy.x ? this.player : this.dummy;
      const right = left === this.player ? this.dummy : this.player;
      const overlap = 48 - (right.x - left.x);
      left.x -= overlap / 2;
      right.x += overlap / 2;
      if (left.x < 24) {
        right.x += 24 - left.x;
        left.x = 24;
      }
      if (right.x > config.width - 24) {
        left.x -= right.x - (config.width - 24);
        right.x = config.width - 24;
      }
    }
    // Collect before resolving so simultaneous active attacks can trade.
    const hits = [
      [this.player, this.dummy],
      [this.dummy, this.player],
    ]
      .filter(
        ([a, b]) =>
          !["knockdown", "getup", "ko"].includes(b.machine.state) &&
          !a.connected &&
          a.hitbox &&
          overlaps(a.hitbox, b.hurtbox),
      )
      .map(([a, b]) => ({ a, b, attack: a.attack! }));
    for (const { a, b, attack } of hits) {
      const previous = a.attack;
      a.attack = attack;
      const chained = b.machine.state === "hitstun";
      const blocked = b.receive(a);
      if (!blocked) {
        a.combo = chained ? a.combo + 1 : 1;
        a.comboDamage = chained
          ? a.comboDamage + config.attacks[attack].damage
          : config.attacks[attack].damage;
        a.comboDisplay = 90;
      } else {
        a.combo = 0;
        a.comboDisplay = 0;
      }
      a.meter = Math.min(100, a.meter + (blocked ? 4 : 16));
      this.events.push({
        x: b.x,
        y: b.y - 65,
        blocked,
        final: b.health === 0,
        attack,
        victim: b === this.player ? "player" : "dummy",
      });
      a.attack = previous;
      a.connected = true;
      this.hitstop = Math.max(this.hitstop, config.attacks[attack].hitstop);
      this.lastHit = blocked
        ? "BLOCK"
        : `${attack.toUpperCase()} · ${config.attacks[attack].damage} DAMAGE`;
    }
    // Receiving a trade must cancel both attacks, including the temporary snapshot.
    for (const { b } of hits) b.attack = null;
    this.remaining--;
    if (!this.player.health || !this.dummy.health || this.remaining <= 0)
      this.result =
        this.player.health === this.dummy.health
          ? "DRAW"
          : this.player.health > this.dummy.health
            ? "PLAYER WINS"
            : "DUMMY WINS";
  }
}
