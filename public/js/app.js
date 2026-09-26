import { PythonEngine } from "./engine.js";
import { drawArena, arenaNames } from "./arena.js";
import { drawFighter, fighters } from "./fighters.js";
import { Particles, drawProjectiles } from "./particles.js";
import { Input } from "./input.js";
import { Audio } from "./audio.js";
import { Music } from "./music.js";
import { HUD } from "./hud.js";
import { Storage } from "./storage.js";
import { setupMenu } from "./menu.js";
import { setupTouch } from "./touch.js";
import { Screens } from "./screens.js";
import { Controls } from "./controls.js";
import { loadedSprites } from "./sprites.js";

const $ = (selector) => document.querySelector(selector);
const canvas = $("#game"),
  ctx = canvas.getContext("2d", { alpha: false });
const store = new Storage(),
  prefs = store.preferences();
const audio = new Audio();
audio.setVolume(prefs.volume);
audio.setMuted(prefs.muted);
audio.musicEnabled = prefs.music;
const music = new Music(audio);
audio.music = music;
const particles = new Particles();
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
particles.reduced = !prefs.effects || reduced.matches;
const engine = new PythonEngine(),
  hud = new HUD($("#hud"), $("#announcement"));
let state = null,
  running = false,
  paused = false,
  ready = false,
  resultSaved = false,
  accumulator = 0,
  last = 0,
  visualTime = 0;
const options = {
  p1: prefs.p1,
  p2: prefs.p2,
  mode: prefs.mode,
  difficulty: prefs.difficulty,
  arena: prefs.arena,
};
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $("#arena").requestFullscreen();
  } catch {
    $("#load-status").textContent = "Bu brauzer to‘liq ekranni qo‘llamaydi.";
  }
}
function pause(force = false) {
  if (!running || state?.phase === "match_over") return;
  if (force && paused) return;
  paused = !paused;
  input.clear();
  screens.pause(paused);
  if (paused) music.stop();
  else {
    canvas.focus({ preventScroll: true });
    music.start();
  }
  accumulator = 0;
}
const input = new Input(pause, fullscreen);
const screens = new Screens({
  pause: () => pause(),
  start: () => start(),
  menu: () => menu(),
});
const controls = new Controls();
setupTouch(input);
function savePreferences() {
  store.savePreferences({
    ...options,
    volume: audio.volume,
    muted: audio.muted,
    music: audio.musicEnabled,
    effects: $("#effects").checked,
  });
}
function updateSoundButton() {
  const button = $("#sound-button");
  button.innerHTML = audio.muted
    ? "◖♪ <span>SOUND OFF</span>"
    : "◖♪ <span>SOUND ON</span>";
  button.setAttribute("aria-pressed", String(audio.muted));
  button.setAttribute(
    "aria-label",
    audio.muted ? "Ovozni yoqish" : "Ovozni o‘chirish",
  );
}
setupMenu({
  options,
  prefs,
  onChange: () => {
    controls.render(options);
    savePreferences();
    $("#arena-label").textContent = arenaNames[options.arena];
    $("#mode-label").textContent =
      options.mode === "cpu"
        ? "ARCADE MODE / PLAYER VS CPU"
        : "LOCAL MODE / PLAYER VS PLAYER";
  },
  onSelect: () => {
    audio.unlock().then(() => {
      audio.play("select");
      music.start();
    });
  },
  onSettings: () => {
    audio.setVolume(Number($("#volume").value) / 100);
    audio.musicEnabled = $("#music").checked;
    particles.reduced = !$("#effects").checked || reduced.matches;
    if (!audio.musicEnabled) music.stop();
    else if (!paused) music.start();
    savePreferences();
  },
  onDialog: () => {
    if (running && !paused) pause(true);
  },
});
updateSoundButton();
store.renderStats();
$("#sound-button").addEventListener("click", async () => {
  await audio.unlock();
  audio.setMuted(!audio.muted);
  updateSoundButton();
  savePreferences();
  if (!paused) music.start();
});
$("#fullscreen-button").addEventListener("click", fullscreen);
$("#start-button").addEventListener("click", () => controls.guide(options));
$("#guide-start").addEventListener("click", () => {
  $("#guide-dialog").close();
  start();
});
$("#guide-cancel").addEventListener("click", () => $("#guide-dialog").close());
$("#retry-button").addEventListener("click", () => location.reload());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running && !paused) pause(true);
  if (document.hidden) music.stop();
  else if (!paused) music.start();
});
reduced.addEventListener("change", () => {
  particles.reduced = !$("#effects").checked || reduced.matches;
});

async function start() {
  if (!ready) return;
  try {
    await audio.unlock();
  } catch (error) {
    console.warn("Audio unavailable", error);
  }
  state = engine.start(options);
  running = true;
  paused = false;
  resultSaved = false;
  accumulator = 0;
  input.enabled = true;
  input.clear();
  particles.clear();
  screens.start();
  hud.show();
  hud.update(state, options);
  music.intense = true;
  music.start();
  canvas.focus({ preventScroll: true });
  $("#arena").scrollIntoView({
    behavior: reduced.matches ? "instant" : "smooth",
    block: "center",
  });
  $("#setup").classList.add("locked");
}
function menu() {
  running = false;
  paused = false;
  input.enabled = false;
  input.clear();
  state = null;
  particles.clear();
  hud.hide();
  screens.menu();
  music.intense = false;
  music.start();
  $("#setup").classList.remove("locked");
  $("#start-button").focus({ preventScroll: true });
}
function processEvents() {
  for (const event of state.events) {
    audio.play(event.type);
    if (["hit", "block", "special"].includes(event.type))
      particles.burst(event);
  }
  if (state.phase === "match_over" && !resultSaved) {
    resultSaved = true;
    store.record(state.winner, options.mode);
    store.renderStats();
    screens.result(state, options);
    music.intense = false;
  }
}
function frame(timestamp) {
  const elapsed = last ? Math.min((timestamp - last) / 1000, 0.075) : 0;
  last = timestamp;
  visualTime += elapsed;
  try {
    if (running && !paused && state.phase !== "match_over") {
      accumulator += elapsed;
      let steps = 0;
      while (accumulator >= 1 / 60 && steps++ < 5) {
        state = engine.tick(1 / 60, input.read());
        processEvents();
        accumulator -= 1 / 60;
      }
      hud.update(state, options);
    }
    particles.update(paused ? 0 : elapsed);
    ctx.save();
    const [sx, sy] = particles.offset();
    ctx.translate(sx, sy);
    drawArena(ctx, options.arena, visualTime, reduced.matches);
    if (state) {
      for (const f of [...state.fighters].sort((a, b) => a.y - b.y))
        drawFighter(ctx, f, visualTime);
      drawProjectiles(ctx, state.projectiles, visualTime);
    } else {
      const preview = [
        {
          kind: options.p1,
          x: 235,
          y: 535,
          facing: 1,
          action: "idle",
          action_time: 0,
        },
        {
          kind: options.p2,
          x: 965,
          y: 535,
          facing: -1,
          action: "idle",
          action_time: 0,
        },
      ];
      for (const f of preview) drawFighter(ctx, f, visualTime, 1.22);
    }
    particles.draw(ctx);
    ctx.restore();
  } catch (error) {
    ctx.restore();
    console.error(error);
    running = false;
    input.enabled = false;
    music.stop();
    $("#announcement").textContent =
      "Xatolik yuz berdi. Sahifani qayta yuklang.";
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
engine
  .load((message) => ($("#load-status").textContent = message))
  .then(() => {
    ready = true;
    $("#start-button").disabled = false;
    $("#start-label").textContent = "JANGNI BOSHLASH";
    $("#load-status").textContent = "PYTHON READY · PRESS START";
  })
  .catch((error) => {
    console.error(error);
    $("#load-status").textContent =
      "Dvigatel yuklanmadi. Internetni tekshiring va qayta yuklang.";
    $("#start-label").textContent = "YUKLASHDA XATOLIK";
    $("#retry-button").hidden = false;
  });
// Read-only inspection hook for automated browser gameplay checks.
globalThis.neonClash = {
  get artLoaded() {
    return loadedSprites();
  },
  get state() {
    return state;
  },
  get ready() {
    return ready;
  },
  get paused() {
    return paused;
  },
  get audioState() {
    return audio.ctx?.state;
  },
  get options() {
    return { ...options };
  },
};
