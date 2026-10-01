import { neutral, type FightInput } from "./InputManager";
import "./touch.css";
type Action = "punch" | "kick" | "block" | "special" | "super" | "jump";
export class TouchControls {
  root = document.createElement("div");
  overlay = document.createElement("div");
  private pointers = new Map<number, Action>();
  private edges = new Set<Action>();
  private stickId: number | null = null;
  private axis = 0;
  private crouch = false;
  private up = false;
  private knob!: HTMLElement;
  private stick!: HTMLElement;
  private active = false;
  private padQuery = matchMedia("(pointer: coarse), (any-pointer: coarse)");
  get mobile() {
    return this.padQuery.matches;
  }
  get rotated() {
    return this.mobile && innerHeight > innerWidth;
  }
  private resize = () => {
    this.clear();
    this.refresh();
  };
  private visibility = () => {
    if (document.hidden) this.clear();
  };
  constructor() {
    this.root.id = "touch-controls";
    this.root.innerHTML = `<div id="joystick" aria-label="Movement joystick: left/right to walk, up to jump, down to crouch"><span class="stick-label">MOVE · ↑ JUMP</span><div class="stick-knob"></div></div><div class="touch-actions">${(["block", "punch", "kick", "special", "super", "jump"] as Action[]).map((a) => `<button data-touch="${a}" aria-label="${a}">${a.toUpperCase()}</button>`).join("")}</div>`;
    this.overlay.id = "rotate-overlay";
    this.overlay.setAttribute("role", "status");
    this.overlay.innerHTML =
      '<div class="phone-symbol" aria-hidden="true">▯ ↻</div><h2>ROTATE YOUR PHONE</h2><p>Landscape gives you room to fight.<br>Your battle is paused.</p>';
    document.body.append(this.root, this.overlay);
    this.stick = this.root.querySelector("#joystick")!;
    this.knob = this.root.querySelector(".stick-knob")!;
    this.stick.addEventListener("pointerdown", (e) => {
      if (!this.active || this.stickId !== null) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      this.stick.setPointerCapture(e.pointerId);
      this.move(e);
    });
    this.stick.addEventListener("pointermove", (e) => {
      if (e.pointerId === this.stickId) {
        e.preventDefault();
        this.move(e);
      }
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      this.stick.addEventListener(type, (e) => {
        if ((e as PointerEvent).pointerId === this.stickId) {
          this.stickId = null;
          this.axis = 0;
          this.crouch = false;
          this.up = false;
          this.knob.style.transform = "translate(0,0)";
        }
      });
    this.root.querySelectorAll<HTMLButtonElement>("[data-touch]").forEach((button) => {
      button.onpointerdown = (e) => {
        if (!this.active) return;
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        const action = button.dataset.touch as Action;
        this.pointers.set(e.pointerId, action);
        this.edges.add(action);
        button.classList.add("pressed");
      };
      const release = (event: Event) => {
        this.pointers.delete((event as PointerEvent).pointerId);
        if (![...this.pointers.values()].includes(button.dataset.touch as Action))
          button.classList.remove("pressed");
      };
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
        button.addEventListener(type, release);
    });
    window.addEventListener("resize", this.resize);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.visibility);
    this.padQuery.addEventListener("change", this.resize);
    this.refresh();
  }
  private move(e: PointerEvent) {
    const r = this.stick.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2;
    const length = Math.hypot(x, y),
      scale = Math.min(1, 42 / Math.max(1, length));
    this.knob.style.transform = `translate(${x * scale}px,${y * scale}px)`;
    this.axis = Math.abs(x) > 16 ? Math.sign(x) : 0;
    this.crouch = y > 24;
    const jumping = y < -28;
    if (jumping && !this.up) this.edges.add("jump");
    this.up = jumping;
  }
  setActive(value: boolean) {
    if (this.active !== value) {
      this.active = value;
      this.clear();
    }
    this.refresh();
  }
  private refresh() {
    this.root.hidden = !this.active || !this.mobile || this.rotated;
    this.overlay.hidden = !this.active || !this.rotated;
    document.body.classList.toggle("touch-battle", this.active && this.mobile);
  }
  sample(): FightInput {
    if (!this.active || this.rotated) return neutral();
    const result = {
      axis: this.axis,
      crouch: this.crouch,
      block: [...this.pointers.values()].includes("block"),
      jump: this.edges.has("jump"),
      punch: this.edges.has("punch"),
      kick: this.edges.has("kick"),
      special: this.edges.has("special"),
      super: this.edges.has("super"),
    };
    this.edges.clear();
    return result;
  }
  setMeter(value: number) {
    const b = this.root.querySelector<HTMLButtonElement>("[data-touch=super]")!;
    b.classList.toggle("ready", value >= 100);
    b.setAttribute("aria-label", `Super ${Math.floor(value)} of 100`);
  }
  clear = () => {
    this.pointers.clear();
    this.edges.clear();
    this.stickId = null;
    this.axis = 0;
    this.crouch = false;
    this.up = false;
    if (this.knob) this.knob.style.transform = "translate(0,0)";
    this.root
      .querySelectorAll(".pressed")
      .forEach((b) => b.classList.remove("pressed"));
  };
  destroy() {
    this.clear();
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.visibility);
    this.padQuery.removeEventListener("change", this.resize);
    this.root.remove();
    this.overlay.remove();
  }
}
