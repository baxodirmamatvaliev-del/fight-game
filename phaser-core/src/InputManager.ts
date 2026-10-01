export interface FightInput {
  axis: number;
  jump: boolean;
  crouch: boolean;
  block: boolean;
  punch: boolean;
  kick: boolean;
  super?: boolean;
  special?: boolean;
}
export const neutral = (): FightInput => ({
  axis: 0,
  jump: false,
  crouch: false,
  block: false,
  punch: false,
  kick: false,
});
const keys = [
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "Space",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyR",
  "KeyB",
  "KeyT",
  "F2",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyN",
  "KeyM",
  "Slash",
  "Period",
];
export class InputManager {
  enabled = true;
  private held = new Set<string>();
  private pressed = new Set<string>();
  private down = (event: KeyboardEvent) => {
    if (!this.enabled) return;
    if (!keys.includes(event.code)) return;
    event.preventDefault();
    if (!this.held.has(event.code)) this.pressed.add(event.code);
    this.held.add(event.code);
  };
  private up = (event: KeyboardEvent) => {
    this.held.delete(event.code);
  };
  clear = () => {
    this.held.clear();
    this.pressed.clear();
  };
  constructor() {
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
    window.addEventListener("blur", this.clear);
  }
  take(key: string) {
    const value = this.pressed.has(key);
    this.pressed.delete(key);
    return value;
  }
  sample(): FightInput {
    // Preserve quick direction taps that start and end between fixed updates.
    const leftTap = this.take("KeyA"),
      rightTap = this.take("KeyD");
    const downTap = this.take("KeyS");
    const heldAxis = Number(this.held.has("KeyD")) - Number(this.held.has("KeyA"));
    return {
      axis: heldAxis || Number(rightTap) - Number(leftTap),
      jump: this.take("KeyW"),
      crouch: this.held.has("KeyS") || downTap,
      block: this.held.has("Space"),
      punch: this.take("KeyJ"),
      kick: this.take("KeyK"),
      super: this.take("KeyL"),
    };
  }
  sampleP2(): FightInput {
    return {
      axis: Number(this.held.has("ArrowRight")) - Number(this.held.has("ArrowLeft")),
      jump: this.take("ArrowUp"),
      crouch: this.held.has("ArrowDown"),
      block: this.held.has("Slash"),
      punch: this.take("KeyN"),
      kick: this.take("KeyM"),
      super: this.take("Period"),
    };
  }
  destroy() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    window.removeEventListener("blur", this.clear);
  }
}
