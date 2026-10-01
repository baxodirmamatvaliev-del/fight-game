export type FighterState =
  | "idle"
  | "walk"
  | "jump"
  | "crouch"
  | "block"
  | "punch"
  | "kick"
  | "special"
  | "super"
  | "knockdown"
  | "getup"
  | "victory"
  | "hitstun"
  | "blockstun"
  | "ko";
export class StateMachine {
  state: FighterState = "idle";
  frame = 0;
  enter(state: FighterState) {
    if (this.state !== state) {
      this.state = state;
      this.frame = 0;
    }
  }
  tick() {
    this.frame++;
  }
  get locked() {
    return [
      "punch",
      "kick",
      "special",
      "super",
      "hitstun",
      "blockstun",
      "knockdown",
      "getup",
      "victory",
      "ko",
    ].includes(this.state);
  }
}
