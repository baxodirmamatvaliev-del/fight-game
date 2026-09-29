import { PythonEngine } from "./engine.js";
import { drawArena, arenaNames } from "./arena.js";
import { drawFighter } from "./fighters.js";
import { Particles, drawProjectiles } from "./particles.js";
import { Input } from "./input.js";
import { Audio } from "./audio.js?v=voices-1";
import { Music } from "./music.js";
import { HUD } from "./hud.js";
import { Storage } from "./storage.js";
import { setupMenu } from "./menu.js";
import { setupTouch } from "./touch.js";
import { Screens } from "./screens.js";
import { Controls } from "./controls.js";
import { loadedSprites, drawSprite } from "./sprites.js";
import { Training } from "./training.js";
import { MobileArena } from "./mobile-arena.js";
import { Fighters3D } from "./fighters-3d.js";
import { interpolateFighters } from "./motion.js";

const $ = (selector) => document.querySelector(selector);
const canvas = $("#game"),
  ctx = canvas.getContext("2d", { alpha: false });
const store = new Storage(),
  prefs = store.preferences();
const audio = new Audio();
const fighters3D = new Fighters3D();
const graphicsReady = fighters3D.load();
graphicsReady.then(() => {
  $("#graphics-status").textContent = fighters3D.ready
    ? "3D JANG · YANGI VERSIYA"
    : "3D ishlamadi. Chrome / Safari’da qayta oching.";
});
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
  previousFighters = null,
  running = false,
  paused = false,
  orientationBlocked = false,
  ready = false,
  resultSaved = false,
  accumulator = 0,
  last = 0,
  visualTime = 0,
  hitStop = 0;
const activePower = new Map();
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
const training = new Training();
setupTouch(input);
const mobileArena = new MobileArena((blocked) => {
  orientationBlocked = blocked;
  input.enabled = running && !blocked;
  input.clear();
  window.dispatchEvent(new Event("combat-input-reset"));
  accumulator = 0;
  hitStop = 0;
  if (blocked) music.stop();
  else if (running && !paused) music.start();
});
$("#rotate-fullscreen").addEventListener("click", () => mobileArena.lockLandscape());
$("#rotate-menu").addEventListener("click", () => menu());
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
  button.setAttribute("aria-label", audio.muted ? "Ovozni yoqish" : "Ovozni o‘chirish");
  $("#arena-sound").textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔊";
  $("#arena-sound").setAttribute(
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
      options.mode === "practice"
        ? "MASHQ / RAQIB HUJUM QILMAYDI"
        : options.mode === "cpu"
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
  if (audio.volume === 0) {
    audio.setVolume(0.8);
    audio.setMuted(false);
    $("#volume").value = 80;
  } else audio.setMuted(!audio.muted);
  updateSoundButton();
  savePreferences();
  if (!paused) music.start();
});
$("#arena-sound").addEventListener("click", () => $("#sound-button").click());
$("#sound-check").addEventListener("click", async () => {
  await audio.unlock();
  audio.setMuted(false);
  if (audio.volume < 0.3) audio.setVolume(0.8);
  $("#volume").value = Math.round(audio.volume * 100);
  audio.play("hit", { damage: 12, player: 0 });
  updateSoundButton();
  savePreferences();
  $("#sound-check").textContent = "🔊 OVOZ YOQILDI";
});
$("#fullscreen-button").addEventListener("click", fullscreen);
$("#start-button").addEventListener("click", () => controls.guide(options));
$("#selection-start").addEventListener("click", () => controls.guide(options));
$("#share-button").addEventListener("click", async () => {
  const url = location.href.split("#")[0];
  try {
    if (navigator.share)
      await navigator.share({ title: "NEON CLASH — jangga kir!", url });
    else {
      await navigator.clipboard.writeText(url);
      $("#share-status").textContent = "Link nusxalandi — do‘stingizga yuboring.";
    }
  } catch (error) {
    if (error.name !== "AbortError") $("#share-status").textContent = url;
  }
});
$("#guide-start").addEventListener("click", () => {
  $("#guide-dialog").close();
  start();
});
$("#guide-cancel").addEventListener("click", () => $("#guide-dialog").close());
$("#guide-practice").addEventListener("click", () => {
  $("#guide-dialog").close();
  $('[data-mode="practice"]').click();
  start();
});
$("#training-reset").addEventListener("click", () => start());
$("#training-fight").addEventListener("click", () => {
  menu();
  $('[data-mode="cpu"]').click();
  controls.guide(options);
});
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
  await graphicsReady;
  state = engine.start(options);
  previousFighters = null;
  running = true;
  paused = false;
  resultSaved = false;
  accumulator = 0;
  hitStop = 0;
  input.enabled = true;
  input.clear();
  particles.clear();
  screens.start();
  hud.show();
  hud.update(state, options);
  training.update(state);
  music.intense = options.mode !== "practice";
  music.start();
  canvas.focus({ preventScroll: true });
  document.body.classList.add("in-match");
  mobileArena.setActive(true);
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
  hitStop = 0;
  training.update(null);
  particles.clear();
  hud.hide();
  screens.menu();
  music.intense = false;
  music.start();
  $("#setup").classList.remove("locked");
  document.body.classList.remove("in-match");
  mobileArena.setActive(false);
  $("#start-button").focus({ preventScroll: true });
}
function processEvents() {
  state.fighters.forEach((f, i) => {
    const id = `${state.round}:${f.attack_serial}:${f.action}`;
    if (["xpower", "finisher"].includes(f.action) && activePower.get(i) !== id)
      audio.play("power");
    activePower.set(i, id);
  });
  for (const event of state.events) {
    audio.play(event.type, event);
    if (["hit", "block", "special"].includes(event.type)) particles.burst(event);
    if (event.type === "hit" && !particles.reduced)
      hitStop = event.special ? 0.065 : 0.04;
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
  if (!running || (!paused && !orientationBlocked && hitStop <= 0))
    visualTime += elapsed;
  try {
    if (running && !paused && !orientationBlocked && state.phase !== "match_over") {
      if (hitStop > 0) {
        hitStop = Math.max(0, hitStop - elapsed);
        accumulator = 0;
      } else accumulator += elapsed;
      let steps = 0;
      while (accumulator >= 1 / 60 && steps++ < 5) {
        previousFighters = state.fighters.map((fighter) => ({ ...fighter }));
        state = engine.tick(1 / 60, input.read());
        processEvents();
        accumulator -= 1 / 60;
        if (hitStop > 0) {
          accumulator = 0;
          break;
        }
      }
      hud.update(state, options);
      training.update(state);
    }
    particles.update(paused || orientationBlocked ? 0 : elapsed);
    ctx.save();
    const [sx, sy] = particles.offset();
    ctx.translate(sx, sy);
    const ultimate = state?.fighters.find((f) =>
      ["xpower", "finisher"].includes(f.action),
    );
    ctx.save();
    if (ultimate && !particles.reduced) {
      const zoom =
        1 +
        0.1 *
          Math.sin(
            Math.min(
              1,
              ultimate.action_time / (ultimate.action === "finisher" ? 1.6 : 1.25),
            ) * Math.PI,
          );
      ctx.translate(600, 360);
      ctx.scale(zoom, zoom);
      ctx.translate(-600, -360);
    }
    drawArena(ctx, options.arena, visualTime, reduced.matches);
    if (ultimate) {
      ctx.fillStyle = "#08061088";
      ctx.fillRect(0, 0, 1200, 640);
    }
    if (state) {
      const presented =
        paused || orientationBlocked || hitStop > 0
          ? state.fighters
          : interpolateFighters(
              previousFighters,
              state.fighters,
              Math.min(1, accumulator * 60),
            );
      if (!fighters3D.render(ctx, presented, visualTime))
        for (const f of [...presented].sort((a, b) => a.y - b.y))
          drawSprite(ctx, f, visualTime) || drawFighter(ctx, f, visualTime);
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
      if (!fighters3D.render(ctx, preview, visualTime))
        for (const f of preview)
          drawSprite(ctx, f, visualTime, 1.22) || drawFighter(ctx, f, visualTime, 1.22);
    }
    particles.draw(ctx);
    ctx.restore();
    ctx.restore();
  } catch (error) {
    ctx.restore();
    console.error(error);
    running = false;
    input.enabled = false;
    music.stop();
    $("#announcement").textContent = "Xatolik yuz berdi. Sahifani qayta yuklang.";
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
engine
  .load((message) => ($("#load-status").textContent = message))
  .then(async () => {
    await graphicsReady;
    ready = true;
    $("#start-button").disabled = false;
    $("#selection-start").disabled = false;
    $("#start-label").textContent = "JANGNI BOSHLASH";
    $("#load-status").textContent = "TAYYOR · QAHRAMONNI TANLANG VA BOSHLANG";
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
  get graphics() {
    return {
      ready: fighters3D.ready,
      error: fighters3D.error,
      actors: fighters3D.actors.length,
      details: fighters3D.ready ? fighters3D.inspect() : null,
    };
  },
  get voices() {
    return { loaded: audio.voices.length, played: audio.voiceCount };
  },
  get audioLevel() {
    if (!audio.analyser) return 0;
    const data = new Uint8Array(audio.analyser.fftSize);
    audio.analyser.getByteTimeDomainData(data);
    return Math.max(...data.map((n) => Math.abs(n - 128)));
  },
  get orientationBlocked() {
    return orientationBlocked;
  },
  get backend() {
    return engine.backend;
  },
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
