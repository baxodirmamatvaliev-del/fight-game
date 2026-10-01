import { roster, type Mode } from "./roster";
import "./menus.css";
type Screen =
  | "title"
  | "main"
  | "select"
  | "vs"
  | "settings"
  | "pause"
  | "moves"
  | "fight"
  | "result";
interface Host {
  start: (mode: Mode, p1: number, p2: number) => void;
  freeze: (paused: boolean) => void;
  volume: (value: number) => void;
  mute: (value: boolean) => void;
  unlock: () => void;
}
export class MenuUI {
  root = document.createElement("div");
  screen: Screen = "title";
  mode: Mode = "arcade";
  p1 = 0;
  p2 = 1;
  hovered = 0;
  private choosing: 1 | 2 = 1;
  private returnTo: Screen = "main";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private raf = 0;
  private volume = 0.6;
  private muted = false;
  private reduced = false;
  private status = "";
  private key = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      e.preventDefault();
      this.back();
      return;
    }
    if (this.screen === "title" && e.code === "Enter") {
      e.preventDefault();
      this.host.unlock();
      this.show("main");
    } else if (
      this.screen === "select" &&
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)
    ) {
      e.preventDefault();
      this.hovered =
        (this.hovered +
          (e.code === "ArrowLeft"
            ? -1
            : e.code === "ArrowRight"
              ? 1
              : e.code === "ArrowUp"
                ? -3
                : 3) +
          6) %
        6;
      this.preview();
      this.root
        .querySelector<HTMLButtonElement>(`[data-fighter="${this.hovered}"]`)
        ?.focus();
    }
  };
  constructor(
    private host: Host,
    private sheet: HTMLCanvasElement,
  ) {
    this.root.id = "menus";
    document.body.append(this.root);
    try {
      const s = JSON.parse(localStorage.getItem("fight-menu-settings") || "{}");
      this.volume =
        typeof s.volume === "number" ? Math.max(0, Math.min(1, s.volume)) : 0.6;
      this.muted = s.muted === true;
      this.reduced =
        typeof s.reduced === "boolean"
          ? s.reduced
          : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    this.applySettings();
    window.addEventListener("keydown", this.key);
    this.show("title");
    this.animate(0);
  }
  private applySettings() {
    this.host.volume(this.volume);
    this.host.mute(this.muted);
    this.root.classList.toggle("reduced", this.reduced);
    try {
      localStorage.setItem(
        "fight-menu-settings",
        JSON.stringify({
          volume: this.volume,
          muted: this.muted,
          reduced: this.reduced,
        }),
      );
    } catch {}
  }
  private button(id: string, label: string, sub = "") {
    return `<button data-action="${id}"><span>${label}</span>${sub ? `<small>${sub}</small>` : ""}<i aria-hidden="true">↗</i></button>`;
  }
  private header(label: string) {
    return `<header><button class="back" data-action="back" aria-label="Go back">← BACK</button><span>NEON CLASH <b>/</b> ${label}</span><span class="edition">PROTOTYPE · 01</span></header>`;
  }
  show(screen: Screen) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.screen = screen;
    this.host.freeze(screen !== "fight");
    this.root.dataset.screen = screen;
    this.root.classList.toggle("playing", screen === "fight");
    let html = "";
    if (screen === "title")
      html = `<div class="title-scene"><div class="sigil" aria-hidden="true"><span>Ⅹ</span></div><p class="eyebrow">ENTER THE ARENA</p><h1>NEON<span>CLASH</span></h1><p class="tagline">Only one will stand.</p>${this.button("enter", "ENTER THE REALM", "PRESS ENTER / TAP TO BEGIN")}<p class="fine">A fighting game prototype · Original placeholder fighters</p></div>`;
    if (screen === "main")
      html = `${this.header("THE REALM")}<div class="main-layout"><div class="main-copy"><p class="eyebrow">CHOOSE YOUR PATH</p><h1>THE NEXT<br><em>CHALLENGER.</em></h1><p>Step into the arena.<br>Leave nothing unfinished.</p><div class="seal" aria-hidden="true">Ⅹ</div></div><nav aria-label="Main menu">${this.button("arcade", "ARCADE", "01 / Face a CPU challenger")}${this.button("versus", "VERSUS", "02 / Local two-player battle")}${this.button("training", "TRAINING", "03 / Master your moves")}${this.button("settings", "SETTINGS", "04 / Sound & accessibility")}</nav></div><footer>FIGHT WITH PURPOSE <span>NO ONLINE MULTIPLAYER · KEYBOARD COMBAT</span></footer>`;
    if (screen === "select")
      html = `${this.header("CHARACTER SELECT")}<div class="select-heading"><p class="eyebrow">${this.mode.toUpperCase()} / CHOOSE YOUR FIGHTER</p><h2 id="selection-step">${this.choosing === 1 ? "PLAYER ONE" : this.mode === "versus" ? "PLAYER TWO" : "CHOOSE OPPONENT"}</h2></div><div class="select-layout"><section class="preview-panel"><div class="preview-halo"></div><canvas id="fighter-preview" width="384" height="360" aria-label="Animated fighter preview"></canvas><div class="preview-copy"><p id="fighter-title" class="eyebrow"></p><h2 id="fighter-name"></h2><p id="fighter-lore"></p></div></section><section class="selection-panel"><div class="portrait-grid" role="group" aria-label="Fighter portraits">${roster.map((f, i) => `<button data-fighter="${i}" aria-label="Select ${f.name}" style="--fighter:${f.color}"><canvas width="160" height="135" data-portrait="${i}"></canvas><strong>${f.name}</strong><span class="cursor p1" ${this.p1 === i ? "" : "hidden"}>P1</span><span class="cursor p2" ${this.p2 === i ? "" : "hidden"}>P2</span></button>`).join("")}</div><div class="move-info"><p class="eyebrow">FIGHTER INTEL</p><div id="fighter-moves"></div><small>Placeholder roster · shared core moveset / distinct palettes</small></div><div class="locks"><span>P1 · ${roster[this.p1].name}</span><span>P2 · ${roster[this.p2].name}</span></div>${this.button("confirm", this.choosing === 1 ? "LOCK PLAYER ONE" : "BEGIN BATTLE", this.choosing === 1 ? "Choose a portrait, then confirm" : "Continue to the versus screen")}</section></div>`;
    if (screen === "vs")
      html = `<div class="vs-screen"><p class="eyebrow">${this.mode.toUpperCase()} · THE FORSAKEN ARENA</p><div class="versus"><section style="--fighter:${roster[this.p1].color}"><canvas data-vs="${this.p1}" width="384" height="320"></canvas><small>PLAYER ONE</small><h2>${roster[this.p1].name}</h2></section><div class="vs">VS</div><section style="--fighter:${roster[this.p2].color}"><canvas data-vs="${this.p2}" width="384" height="320"></canvas><small>${this.mode === "versus" ? "PLAYER TWO" : this.mode === "arcade" ? "CPU CHALLENGER" : "TRAINING DUMMY"}</small><h2>${roster[this.p2].name}</h2></section></div>${this.button("fight", "FIGHT", "ENTER THE ARENA")}<p class="fine">${this.mode === "versus" ? "P2: arrows to move · N punch · M kick · / block · . super" : "P1: A/D move · W jump · S crouch · J punch · K kick · Space block"}</p></div>`;
    if (screen === "settings")
      html = `${this.header("SETTINGS")}<section class="dialog"><p class="eyebrow">MAKE IT YOURS</p><h2>SETTINGS</h2><label class="setting">Master volume <output id="volume-value">${Math.round(this.volume * 100)}%</output><input aria-label="Master volume" id="volume" type="range" min="0" max="100" value="${this.volume * 100}"></label><label class="setting">Mute audio <input id="mute" type="checkbox" ${this.muted ? "checked" : ""}></label><label class="setting">Reduce motion <input id="motion" type="checkbox" ${this.reduced ? "checked" : ""}></label><p>Disables menu animation and combat screen shake. Settings save on this device.</p>${this.button("back", "DONE")}</section>`;
    if (screen === "pause")
      html = `${this.header("PAUSED")}<section class="dialog"><p class="eyebrow">TAKE A BREATH</p><h2>BATTLE PAUSED</h2><nav>${this.button("resume", "RESUME")}${this.button("moves", "MOVE LIST")}${this.button("settings", "SETTINGS")}${this.button("rematch", "RESTART ROUND")}${this.button("quit", "MAIN MENU")}</nav></section>`;
    if (screen === "moves")
      html = `${this.header("MOVE LIST")}<section class="dialog wide"><p class="eyebrow">${roster[this.p1].name} / COMBAT MANUAL</p><h2>KNOW YOUR MOVES</h2><table><thead><tr><th>MOVE</th><th>P1</th><th>P2</th></tr></thead><tbody>${[
        ["Move", "A / D", "← / →"],
        ["Jump / crouch", "W / S", "↑ / ↓"],
        ["Block", "Space", "/"],
        ["Punch / kick", "J / K", "N / M"],
        ["Special", "S → forward + J", "↓ → forward + N"],
        ["Super · 100 meter", "L", "."],
        ["Combo", "Punch → kick on hit", "Punch → kick on hit"],
      ]
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join(
          "",
        )}</tbody></table><p>Forward follows the opponent. Specials: down then forward + punch within 300 ms. Training: B toggles dummy guard, T triggers a dummy punch.</p>${this.button("back", "BACK TO PAUSE")}</section>`;
    if (screen === "fight")
      html =
        '<button class="pause-button" data-action="pause" aria-label="Pause battle">Ⅱ <span>PAUSE / ESC</span></button>';
    if (screen === "result")
      html = `${this.header("ROUND COMPLETE")}<section class="dialog"><p class="eyebrow">THE ARENA HAS SPOKEN</p><h2>${this.status}</h2>${this.button("rematch", "REMATCH")}${this.button("select-again", "CHANGE FIGHTERS")}${this.button("quit", "MAIN MENU")}</section>`;
    this.root.innerHTML = html;
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-action]")
      .forEach((b) => (b.onclick = () => this.action(b.dataset.action!)));
    this.root.querySelectorAll<HTMLButtonElement>("[data-fighter]").forEach((b) => {
      const update = () => {
        this.hovered = Number(b.dataset.fighter);
        this.preview();
      };
      b.onmouseenter = update;
      b.onfocus = update;
      b.onclick = () => {
        update();
        this.choose();
      };
    });
    if (screen === "select") this.preview();
    if (screen === "settings") {
      this.root.querySelector<HTMLInputElement>("#volume")!.oninput = (e) => {
        this.volume = Number((e.target as HTMLInputElement).value) / 100;
        this.root.querySelector("output")!.textContent =
          `${Math.round(this.volume * 100)}%`;
        this.applySettings();
      };
      this.root.querySelector<HTMLInputElement>("#mute")!.onchange = (e) => {
        this.muted = (e.target as HTMLInputElement).checked;
        this.applySettings();
      };
      this.root.querySelector<HTMLInputElement>("#motion")!.onchange = (e) => {
        this.reduced = (e.target as HTMLInputElement).checked;
        this.applySettings();
      };
    }
    this.root
      .querySelector<HTMLButtonElement>(
        screen === "select" ? `[data-fighter="${this.hovered}"]` : "button:not(.back)",
      )
      ?.focus({ preventScroll: true });
  }
  private choose() {
    if (this.choosing === 1) this.p1 = this.hovered;
    else this.p2 = this.hovered;
    this.preview();
  }
  private preview() {
    const f = roster[this.hovered];
    this.root.style.setProperty("--accent", f.color);
    const name = this.root.querySelector("#fighter-name");
    if (!name) return;
    name.textContent = f.name;
    this.root.querySelector("#fighter-title")!.textContent = f.title;
    this.root.querySelector("#fighter-lore")!.textContent = f.lore;
    this.root.querySelector("#fighter-moves")!.innerHTML =
      `<div><span>${f.special}</span><kbd>↓ → + PUNCH</kbd></div><div><span>${f.super}</span><kbd>SUPER · 100</kbd></div>`;
    this.root.querySelectorAll<HTMLElement>("[data-fighter]").forEach((b) => {
      const n = Number(b.dataset.fighter);
      b.classList.toggle("hovered", n === this.hovered);
      b.querySelector<HTMLElement>(".p1")!.hidden = n !== this.p1;
      b.querySelector<HTMLElement>(".p2")!.hidden = n !== this.p2;
    });
    const locks = this.root.querySelector(".locks");
    if (locks)
      locks.innerHTML = `<span>P1 · ${roster[this.p1].name}</span><span>P2 · ${roster[this.p2].name}</span>`;
  }
  private action(action: string) {
    this.host.unlock();
    if (["arcade", "versus", "training"].includes(action)) {
      this.mode = action as Mode;
      this.choosing = 1;
      this.hovered = this.p1;
      this.show("select");
    } else if (action === "enter" || action === "quit") this.show("main");
    else if (action === "back") this.back();
    else if (action === "confirm") {
      this.choose();
      if (this.choosing === 1) {
        this.choosing = 2;
        this.hovered = this.p2;
        this.show("select");
      } else this.show("vs");
    } else if (action === "fight" || action === "rematch") {
      this.show("fight");
      this.host.start(this.mode, this.p1, this.p2);
    } else if (action === "pause") this.show("pause");
    else if (action === "resume") this.show("fight");
    else if (action === "settings") {
      this.returnTo = this.screen;
      this.show("settings");
    } else if (action === "moves") this.show("moves");
    else if (action === "select-again") {
      this.choosing = 1;
      this.show("select");
    }
  }
  back() {
    if (this.screen === "main") {
      this.show("title");
      return;
    }
    if (this.screen === "fight") this.show("pause");
    else if (this.screen === "pause") this.show("fight");
    else if (this.screen === "settings") this.show(this.returnTo);
    else if (this.screen === "moves") this.show("pause");
    else if (this.screen === "vs") this.show("select");
    else if (this.screen === "select" && this.choosing === 2) {
      this.choosing = 1;
      this.show("select");
    } else if (this.screen !== "title") this.show("main");
  }
  result(text: string) {
    if (this.screen !== "fight" || this.timer) return;
    this.status = text;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.screen === "fight") this.show("result");
    }, 1800);
  }
  get reduceMotion() {
    return this.reduced;
  }
  private animate = (time: number) => {
    const frame = this.reduced ? 0 : Math.floor(time / 120) % 8;
    this.root.querySelectorAll<HTMLCanvasElement>("canvas").forEach((canvas) => {
      const index =
        canvas.id === "fighter-preview"
          ? this.hovered
          : Number(canvas.dataset.portrait ?? canvas.dataset.vs);
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const portrait = canvas.dataset.portrait !== undefined;
      const scale = portrait ? 2.1 : 2.6;
      const width = 192 * scale,
        height = 160 * scale;
      ctx.drawImage(
        this.sheet,
        frame * 192,
        0,
        192,
        160,
        (canvas.width - width) / 2,
        portrait ? 0 : canvas.height - height + 18,
        width,
        height,
      );
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = roster[index].color;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    });
    this.raf = requestAnimationFrame(this.animate);
  };
  destroy() {
    if (this.timer) clearTimeout(this.timer);
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.key);
    this.root.remove();
  }
}
