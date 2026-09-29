import { fighters, drawPortrait } from "./fighters.js";
export class HUD {
  constructor(element, announcement) {
    this.element = element;
    this.announcement = announcement;
    element.innerHTML = `<div class="hud-player hud-left"><div class="hud-name"><strong></strong><span></span></div><div class="health-track"><div class="health-fill"></div></div><div class="hud-sub"><div class="energy-track"><div class="energy-fill"></div></div><div class="round-dots"><i></i><i></i></div></div><div class="combo-label"></div><div class="energy-label"></div></div><div class="hud-center"><span class="hud-round"></span><strong class="hud-timer"></strong><span class="hud-versus">VS</span></div><div class="hud-player hud-right"><div class="hud-name"><strong></strong><span></span></div><div class="health-track"><div class="health-fill"></div></div><div class="hud-sub"><div class="energy-track"><div class="energy-fill"></div></div><div class="round-dots"><i></i><i></i></div></div><div class="combo-label"></div><div class="energy-label"></div></div>`;
    this.players = [...element.querySelectorAll(".hud-player")];
    for (const player of this.players) {
      const portrait = document.createElement("canvas");
      portrait.className = "hud-portrait";
      portrait.setAttribute("aria-hidden", "true");
      player.append(portrait);
    }
  }
  show() {
    this.element.hidden = false;
  }
  hide() {
    this.element.hidden = true;
    this.announcement.textContent = "";
    this.announcement.className = "announcement";
  }
  update(state, options) {
    this.players.forEach((el, i) => {
      const f = state.fighters[i],
        def = fighters[f.kind];
      const portrait = el.querySelector(".hud-portrait");
      if (portrait.dataset.kind !== f.kind) {
        drawPortrait(portrait, f.kind);
        portrait.dataset.kind = f.kind;
      }
      el.style.setProperty("--fighter-color", def.color);
      el.querySelector("strong").textContent = def.name;
      el.querySelector(".hud-name span").textContent =
        i === 0
          ? "PLAYER 01"
          : options.mode === "practice"
            ? "MASHQ RAQIBI"
            : options.mode === "cpu"
              ? "CPU"
              : "PLAYER 02";
      const health = el.querySelector(".health-fill");
      health.style.transform = `scaleX(${f.health / 100})`;
      health.classList.toggle("critical", f.health < 25);
      el.querySelector(".energy-fill").style.transform = `scaleX(${f.energy / 100})`;
      el.querySelector(".energy-track").classList.toggle("charged", f.energy >= 35);
      el.querySelectorAll(".round-dots i").forEach((dot, j) =>
        dot.classList.toggle("won", state.wins[i] > j),
      );
      el.querySelector(".combo-label").textContent =
        f.combo >= 2 ? `${f.combo} HIT COMBO` : "";
      el.querySelector(".energy-label").textContent =
        f.energy >= 100
          ? "X-KUCH TAYYOR · X"
          : f.energy >= 35
            ? `MAXSUS TAYYOR · X ${Math.floor(f.energy)}%`
            : `${Math.floor(f.energy)} / 35 ENERGY`;
    });
    this.element.querySelector(".hud-round").textContent =
      options.mode === "practice" ? "MASHQ" : `ROUND ${state.round}`;
    this.element.querySelector(".hud-timer").textContent =
      options.mode === "practice"
        ? "∞"
        : String(Math.ceil(state.remaining)).padStart(2, "0");
    const a = this.announcement;
    const [player, opponent] = state.fighters;
    for (const action of ["xpower", "finisher"]) {
      const button = document.querySelector(`[data-action="${action}"]`);
      const ready =
        action === "xpower"
          ? player.energy >= 100
          : player.energy >= 50 &&
            opponent.health <= 20 &&
            Math.abs(player.x - opponent.x) <= 185;
      button?.classList.toggle("unavailable", !ready);
      button?.classList.toggle("power-ready", ready);
      button?.setAttribute(
        "aria-label",
        action === "xpower"
          ? `X-kuch: ${Math.floor(player.energy)} / 100 energiya`
          : ready
            ? "Yakunlovchi hujum tayyor"
            : "Yakun: 50 energiya, yaqin raqib 20 HP yoki kam",
      );
    }
    a.className = "announcement";
    if (state.phase === "countdown") {
      a.innerHTML =
        state.phase_time > 0.65
          ? `<small>ROUND ${state.round}</small>READY?`
          : '<span class="lime">FIGHT!</span>';
    } else if (state.phase === "round_over") {
      const tie = state.round_winner === null;
      const finish =
        !tie &&
        state.fighters[state.round_winner].action === "finisher" &&
        Math.min(...state.fighters.map((f) => f.health)) <= 0;
      a.innerHTML = `<small>${tie ? "DRAW" : fighters[state.fighters[state.round_winner].kind].name + " WINS THE ROUND"}</small>${tie ? "DURANG" : finish ? "FATALITY" : Math.min(...state.fighters.map((f) => f.health)) <= 0 ? "K.O." : "TIME UP"}`;
    } else if (state.fighters.some((f) => ["xpower", "finisher"].includes(f.action))) {
      const active = state.fighters.find((f) =>
        ["xpower", "finisher"].includes(f.action),
      );
      a.innerHTML = `<small>${fighters[active.kind].name}</small>${active.action === "finisher" ? "YAKUNLOVCHI ZARBA" : "X-KUCH"}`;
    } else if (
      opponent.health <= 20 &&
      state.phase === "fight" &&
      options.mode !== "practice"
    ) {
      a.innerHTML =
        "<small>YAQINLASHING · 50 ENERGIYA · V / YAKUN</small>YAKUNLASH IMKONI";
    } else a.textContent = "";
  }
}
