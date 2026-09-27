import { fighters } from "./fighters.js";
const defaults = {
  p1: "subzero",
  p2: "scorpion",
  mode: "cpu",
  difficulty: "normal",
  arena: "forest",
  volume: 0.65,
  muted: false,
  music: true,
  effects: true,
};
export class Storage {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(`neon-clash:${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  write(key, value) {
    try {
      localStorage.setItem(`neon-clash:${key}`, JSON.stringify(value));
    } catch {
      /* Gameplay works even if storage is unavailable. */
    }
  }
  preferences() {
    const value = this.read("preferences", {}),
      p = { ...defaults };
    if (!value || typeof value !== "object") return p;
    for (const [key, choices] of Object.entries({
      p1: Object.keys(fighters),
      p2: Object.keys(fighters),
      mode: ["cpu", "local", "practice"],
      difficulty: ["easy", "normal", "hard"],
      arena: ["forest", "city", "temple", "void"],
    }))
      if (choices.includes(value[key])) p[key] = value[key];
    if (value.layoutVersion !== 2 && value.arena === "city") p.arena = "forest";
    if (Number.isFinite(value.volume))
      p.volume = Math.max(0, Math.min(1, value.volume));
    for (const key of ["muted", "music", "effects"])
      if (typeof value[key] === "boolean") p[key] = value[key];
    return p;
  }
  savePreferences(value) {
    this.write("preferences", { ...value, layoutVersion: 2 });
  }
  stats() {
    const s = this.read("stats", {});
    return {
      matches: Number.isSafeInteger(s?.matches) && s.matches >= 0 ? s.matches : 0,
      wins: Number.isSafeInteger(s?.wins) && s.wins >= 0 ? s.wins : 0,
    };
  }
  record(winner, mode) {
    if (mode !== "cpu") return;
    const s = this.stats();
    s.matches++;
    if (winner === 0) s.wins++;
    this.write("stats", s);
  }
  renderStats() {
    const s = this.stats();
    document.querySelector("#stat-matches").textContent = String(s.matches).padStart(
      2,
      "0",
    );
    document.querySelector("#stat-wins").textContent = String(s.wins).padStart(2, "0");
  }
}
