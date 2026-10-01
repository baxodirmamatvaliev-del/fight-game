import { config, type AttackName } from "./config";
import { StateMachine } from "./StateMachine";
import type { FightInput } from "./InputManager";
import { MotionInput } from "./MotionInput";
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
export class Fighter {
  machine = new StateMachine();
  y = config.floor;
  vx = 0;
  vy = 0;
  health = config.fighter.health;
  facing: 1 | -1 = 1;
  attack: AttackName | null = null;
  connected = false;
  stun = 0;
  meter = 0;
  combo = 0;
  comboDamage = 0;
  comboDisplay = 0;
  motion = new MotionInput();
  constructor(public x: number) {}
  get grounded() {
    return this.y >= config.floor;
  }
  get hurtbox(): Box {
    const height =
      this.machine.state === "crouch"
        ? config.fighter.crouchHeight
        : config.fighter.height;
    return { x: this.x - 24, y: this.y - height, width: 48, height };
  }
  get hitbox(): Box | null {
    // Keep the active box visible during hitstop after contact. FightWorld
    // separately prevents this attack from damaging its target twice.
    if (!this.attack) return null;
    const a = config.attacks[this.attack],
      frame = this.machine.frame;
    if (frame < a.startup || frame >= a.startup + a.active) return null;
    return {
      x: this.facing === 1 ? this.x + 20 : this.x - 20 - a.reach,
      y: this.y - a.offsetY,
      width: a.reach,
      height: a.height,
    };
  }
  step(input: FightInput, opponentX: number) {
    if (this.machine.state === "ko") return;
    if (this.comboDisplay > 0) this.comboDisplay--;
    const motionSpecial = this.motion.sample(input, this.facing);
    const special = motionSpecial || input.special === true;
    this.machine.tick();
    if (this.machine.state === "knockdown" || this.machine.state === "getup") {
      this.x = Math.max(24, Math.min(config.width - 24, this.x + this.vx / config.fps));
      this.vx *= 0.86;
      this.y = config.floor;
      if (this.machine.state === "knockdown" && this.machine.frame >= 36)
        this.machine.enter("getup");
      else if (this.machine.state === "getup" && this.machine.frame >= 24)
        this.machine.enter("idle");
      return;
    }
    // Confirmed normal attacks can cancel after contact into a stronger attack.
    if (
      this.connected &&
      (this.attack === "punch" || this.attack === "kick") &&
      (special ||
        (this.attack === "punch" && input.kick) ||
        (input.super && this.meter >= 100))
    ) {
      this.attack = null;
      this.machine.enter("idle");
    }
    if (this.attack) {
      const a = config.attacks[this.attack];
      if (this.machine.frame >= a.startup + a.active + a.recovery) {
        this.attack = null;
        this.machine.enter("idle");
      }
    }
    if (this.stun > 0 && --this.stun === 0) this.machine.enter("idle");
    if (!this.machine.locked) {
      this.facing = opponentX >= this.x ? 1 : -1;
      this.vx = input.axis * config.fighter.speed;
      if (this.grounded) {
        if (input.block) {
          this.machine.enter("block");
          this.vx = 0;
        } else if (special || (input.super && this.meter >= 100)) {
          this.attack = input.super && this.meter >= 100 ? "super" : "special";
          if (this.attack === "super") this.meter = 0;
          this.connected = false;
          this.machine.enter(this.attack);
          this.vx = 0;
        } else if (input.crouch) {
          this.machine.enter("crouch");
          this.vx = 0;
        } else if (input.punch || input.kick) {
          this.attack = input.punch ? "punch" : "kick";
          this.connected = false;
          this.machine.enter(this.attack);
          this.vx = 0;
        } else if (input.jump) {
          this.vy = -config.fighter.jump;
          this.machine.enter("jump");
        } else this.machine.enter(input.axis ? "walk" : "idle");
      } else this.machine.enter("jump");
    } else this.vx *= 0.86;
    this.x = Math.max(24, Math.min(config.width - 24, this.x + this.vx / config.fps));
    if (!this.grounded || this.vy < 0) {
      this.vy += config.fighter.gravity / config.fps;
      this.y += this.vy / config.fps;
    }
    if (this.y >= config.floor) {
      this.y = config.floor;
      this.vy = 0;
    }
  }
  receive(attacker: Fighter) {
    if (!attacker.attack) return false;
    const a = config.attacks[attacker.attack];
    const blocked =
      (this.machine.state === "block" || this.machine.state === "blockstun") &&
      (attacker.x - this.x) * this.facing >= 0;
    this.health = Math.max(0, this.health - (blocked ? 0 : a.damage));
    this.attack = null;
    this.stun = blocked ? 10 : a.stun;
    this.vx = attacker.facing * a.knockback * (blocked ? 0.3 : 1);
    this.meter = Math.min(100, this.meter + (blocked ? 3 : 8));
    this.machine.enter(
      this.health === 0
        ? "ko"
        : blocked
          ? "blockstun"
          : a.knockdown
            ? "knockdown"
            : "hitstun",
    );
    if (a.knockdown && !blocked) this.stun = 0;
    this.machine.frame = 0;
    return blocked;
  }
}
