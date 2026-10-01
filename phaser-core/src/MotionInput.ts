// Simulation-frame timestamps: no browser timing dependency. Forward is relative
// to facing; the command is consumed once and expires after 18 active frames.
import type { FightInput } from "./InputManager";
export class MotionInput {
  private downAt = -1000;
  private forwardAt = -1000;
  private lastDown = false;
  private lastForward = false;
  private tick = 0;
  sample(input: FightInput, facing: number) {
    this.tick++;
    const forward = input.axis === facing;
    if (input.crouch && !this.lastDown) {
      this.downAt = this.tick;
      this.forwardAt = -1000;
    }
    if (
      forward &&
      !this.lastForward &&
      this.tick > this.downAt &&
      this.tick - this.downAt <= 18
    )
      this.forwardAt = this.tick;
    const special =
      input.punch &&
      forward &&
      this.forwardAt >= this.downAt &&
      this.tick - this.downAt <= 18;
    this.lastDown = input.crouch;
    this.lastForward = forward;
    if (special) {
      this.downAt = -1000;
      this.forwardAt = -1000;
    }
    return special;
  }
}
