const maps = [
  {
    KeyA: "left",
    KeyD: "right",
    KeyW: "jump",
    KeyS: "block",
    KeyJ: "punch",
    KeyK: "kick",
    KeyL: "special",
    ArrowLeft: "punch",
    ArrowRight: "kick",
    ArrowUp: "special",
    ArrowDown: "block",
  },
  {
    Numpad4: "left",
    Numpad6: "right",
    Numpad8: "jump",
    Numpad5: "block",
    Digit1: "punch",
    Digit2: "kick",
    Digit3: "special",
    Numpad1: "punch",
    Numpad2: "kick",
    Numpad3: "special",
  },
];
export class Input {
  constructor(onPause, onFullscreen) {
    this.keyboard = [new Set(), new Set()];
    this.pending = [new Set(), new Set()];
    this.touch = new Set();
    this.enabled = false;
    this.onPause = onPause;
    this.padPause = false;
    window.addEventListener("keydown", (e) => {
      if (!this.enabled || document.querySelector("dialog[open]")) return;
      if (
        ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(
          document.activeElement?.tagName,
        )
      )
        return;
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        if (!e.repeat) onPause();
        return;
      }
      if (e.code === "KeyF") {
        if (!e.repeat) onFullscreen();
        return;
      }
      maps.forEach((m, i) => {
        if (m[e.code]) {
          e.preventDefault();
          this.keyboard[i].add(m[e.code]);
          if (!e.repeat) this.pending[i].add(m[e.code]);
        }
      });
    });
    window.addEventListener("keyup", (e) =>
      maps.forEach((m, i) => this.keyboard[i].delete(m[e.code])),
    );
    window.addEventListener("blur", () => {
      this.clear();
      if (this.enabled) onPause(true);
    });
  }
  clear() {
    this.keyboard.forEach((s) => s.clear());
    this.pending.forEach((s) => s.clear());
    this.touch.clear();
  }
  read() {
    const output = this.keyboard.map(
      (s, i) => new Set([...s, ...this.pending[i]]),
    );
    this.pending.forEach((s) => s.clear());
    this.touch.forEach((a) => output[0].add(a));
    const pads = Array.from(navigator.getGamepads?.() || [])
      .filter(Boolean)
      .slice(0, 2);
    let pause = false;
    pads.forEach((p, i) => {
      const s = output[i];
      if (p.axes[0] < -0.25 || p.buttons[14]?.pressed) s.add("left");
      if (p.axes[0] > 0.25 || p.buttons[15]?.pressed) s.add("right");
      for (const [index, action] of [
        [0, "jump"],
        [2, "punch"],
        [3, "kick"],
        [1, "special"],
        [4, "block"],
        [12, "jump"],
      ])
        if (p.buttons[index]?.pressed) s.add(action);
      pause ||= !!p.buttons[9]?.pressed;
    });
    if (pause && !this.padPause) this.onPause();
    this.padPause = pause;
    return output.map((s) => [...s]);
  }
}
