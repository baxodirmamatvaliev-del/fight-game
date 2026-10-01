import Phaser from "phaser";
import { config } from "./config";
import { FightWorld } from "./FightWorld";
import { InputManager, neutral } from "./InputManager";
import type { Fighter } from "./Fighter";
import { createPlaceholderSheet, SpriteFighter } from "./SpriteFighter";
import { AudioManager } from "./AudioManager";
import { MenuUI } from "./ui/MenuUI";
import { roster, type Mode } from "./ui/roster";
import { TouchControls } from "./TouchControls";
import { SparkPool } from "./SparkPool";

class FightScene extends Phaser.Scene {
  world = new FightWorld();
  controls!: InputManager;
  graphics!: Phaser.GameObjects.Graphics;
  status!: Phaser.GameObjects.Text;
  clock!: Phaser.GameObjects.Text;
  accumulator = 0;
  debug = false;
  focused = true;
  views!: [SpriteFighter, SpriteFighter];
  effects!: Phaser.GameObjects.Graphics;
  sparks = new SparkPool();
  touch!: TouchControls;
  slowRemaining = 0;
  endFrame = 0;
  meterText!: Phaser.GameObjects.Text;
  audio!: AudioManager;
  soundLabel!: Phaser.GameObjects.Text;
  announcement!: Phaser.GameObjects.Text;
  menu!: MenuUI;
  menuPaused = true;
  mode: Mode = "training";
  selection: [number, number] = [0, 1];
  testArena = import.meta.env.DEV && new URLSearchParams(location.search).has("arena");
  startBattle(mode: Mode, p1: number, p2: number) {
    this.mode = mode;
    this.selection = [p1, p2];
    this.world = new FightWorld();
    this.audio.reset();
    this.controls.clear();
    this.accumulator = 0;
    this.sparks.clear();
    this.endFrame = 0;
    this.slowRemaining = 0;
    this.cameras.main.shakeEffect.reset();
    this.views[0].sprite.setTint(parseInt(roster[p1].color.slice(1), 16));
    this.views[1].sprite.setTint(parseInt(roster[p2].color.slice(1), 16));
    if (mode === "training" && !this.testArena) {
      this.world.player.meter = 100;
      this.world.dummy.health = 100;
    }
  }
  create() {
    // Mobile viewport changes can arrive after Phaser's window resize event.
    const parent = document.getElementById("game")!;
    const resize = new ResizeObserver(() => {
      const bounds = parent.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0)
        this.scale.setParentSize(bounds.width, bounds.height);
    });
    resize.observe(parent);
    this.events.once("shutdown", () => resize.disconnect());
    this.audio = new AudioManager();
    if (!this.testArena) this.audio.deferRound();
    this.soundLabel = this.add
      .text(740, 20, "TAP / KEY: ENABLE AUDIO", { fontSize: "13px", color: "#b4c6da" })
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.soundLabel.on("pointerdown", () => {
      // A suspended context needs resuming, not toggling into mute.
      if (this.audio.context?.state === "running")
        this.audio.setMuted(!this.audio.muted);
      void this.audio.unlock();
    });
    this.announcement = this.add
      .text(480, 180, "", { fontSize: "18px", color: "#ffdb9c" })
      .setOrigin(0.5)
      .setDepth(5);
    this.controls = new InputManager();
    this.touch = new TouchControls();
    this.graphics = this.add.graphics();
    createPlaceholderSheet(this);
    this.views = [new SpriteFighter(this, 0x70dfd2), new SpriteFighter(this, 0xffc780)];
    this.views[0].sprite.setData("player", true);
    this.effects = this.add.graphics().setDepth(3);
    this.meterText = this.add.text(28, 105, "", { fontSize: "13px", color: "#b9cced" });
    this.add.text(28, 20, "FIGHT ENGINE / CORE", {
      fontSize: "18px",
      color: "#92a7c0",
    });
    this.clock = this.add
      .text(480, 55, "", { fontSize: "28px", color: "#ffffff" })
      .setOrigin(0.5, 0);
    this.status = this.add
      .text(480, 125, "", { fontSize: "15px", color: "#b4c6da", align: "center" })
      .setOrigin(0.5, 0);
    this.add.text(
      28,
      462,
      "A/D MOVE · W JUMP · S CROUCH · SPACE BLOCK · J PUNCH · K KICK\nS → FORWARD + J SPECIAL · L SUPER (100) · R RESET · B GUARD · T DUMMY PUNCH · F2 BOXES",
      { fontSize: "13px", color: "#b4c6da", lineSpacing: 12 },
    );
    const resetClock = () => {
      this.focused = false;
      this.accumulator = 0;
      this.controls.clear();
      this.audio.pause();
    };
    const resume = () => {
      this.focused = true;
      this.audio.resume();
      this.accumulator = 0;
    };
    this.game.events.on(Phaser.Core.Events.BLUR, resetClock);
    this.game.events.on(Phaser.Core.Events.FOCUS, resume);
    this.events.once("shutdown", () => {
      this.controls.destroy();
      this.audio.destroy();
      this.game.events.off(Phaser.Core.Events.BLUR, resetClock);
      this.game.events.off(Phaser.Core.Events.FOCUS, resume);
    });
    if (import.meta.env.DEV) Object.assign(window, { fightCore: this });
    this.menu = new MenuUI(
      {
        start: (mode, p1, p2) => this.startBattle(mode, p1, p2),
        freeze: (paused) => {
          this.menuPaused = paused;
          this.controls.enabled = !paused;
          this.accumulator = 0;
          this.controls.clear();
          this.touch.setActive(!paused);
        },
        volume: (value) => this.audio.setVolume(value),
        mute: (value) => this.audio.setMuted(value),
        unlock: () => {
          void this.audio.unlock();
        },
      },
      this.textures.get("fighter-placeholder").getSourceImage() as HTMLCanvasElement,
    );
    if (this.testArena) this.menu.show("fight");
    this.events.once("shutdown", () => this.menu.destroy());
    this.events.once("shutdown", () => this.touch.destroy());
  }
  update(_time: number, delta: number) {
    if (this.touch.rotated && !this.menuPaused) {
      this.accumulator = 0;
      this.controls.clear();
      return;
    }
    if (this.menuPaused) {
      this.accumulator = 0;
      return;
    }
    if (!this.focused) {
      this.accumulator = 0;
      return;
    }
    if (this.controls.take("KeyR")) {
      this.world = new FightWorld();
      this.audio.reset();
      this.controls.clear();
      this.accumulator = 0;
      this.sparks.clear();
      this.touch.clear();
      this.slowRemaining = 0;
      this.endFrame = 0;
      this.cameras.main.shakeEffect.reset();
    }
    if (this.controls.take("KeyB")) this.world.dummyBlocks = !this.world.dummyBlocks;
    if (this.controls.take("F2")) this.debug = !this.debug;
    const dt = Math.min(delta, 100);
    const timeScale = this.slowRemaining > 0 ? 0.22 : 1;
    this.slowRemaining = Math.max(0, this.slowRemaining - dt);
    this.sparks.update(dt * timeScale);
    if (this.world.result) this.endFrame += (dt * timeScale * 60) / 1000;
    this.accumulator += dt * timeScale;
    const step = 1000 / config.fps;
    while (this.accumulator >= step) {
      const advancing = !this.world.hitstop && !this.world.result;
      // Retain input edges through hitstop until the simulation can consume them.
      if (this.world.hitstop)
        this.world.step({
          axis: 0,
          jump: false,
          crouch: false,
          block: false,
          punch: false,
          kick: false,
        });
      else {
        let opponent = {
          axis: 0,
          jump: false,
          crouch: false,
          block: false,
          punch: this.controls.take("KeyT"),
          kick: false,
        };
        if (this.mode === "versus") opponent = this.controls.sampleP2();
        else if (this.mode === "arcade") {
          const distance = this.world.player.x - this.world.dummy.x;
          opponent = {
            ...neutral(),
            axis: Math.abs(distance) > 90 ? Math.sign(distance) : 0,
            block: Math.abs(distance) < 110 && this.world.ticks % 180 < 35,
            punch: Math.abs(distance) < 100 && this.world.ticks % 48 === 0,
            kick: Math.abs(distance) < 125 && this.world.ticks % 77 === 0,
          };
        }
        const keyboard = this.controls.sample(),
          touch = this.touch.sample();
        this.world.step(
          {
            axis: touch.axis || keyboard.axis,
            jump: touch.jump || keyboard.jump,
            crouch: touch.crouch || keyboard.crouch,
            block: touch.block || keyboard.block,
            punch: touch.punch || keyboard.punch,
            kick: touch.kick || keyboard.kick,
            special: touch.special,
            super: touch.super || keyboard.super,
          },
          opponent,
        );
        if (this.mode === "training" && !this.testArena) {
          this.world.remaining = config.roundFrames;
          if (this.world.dummy.health === 0) {
            this.world.dummy.health = 100;
            this.world.dummy.machine.enter("idle");
            this.world.result = "";
          }
          this.world.player.meter = 100;
        }
      }
      this.accumulator -= step;
      if (advancing)
        for (const fighter of [this.world.player, this.world.dummy]) {
          if (fighter.attack && fighter.machine.frame === 0)
            this.audio.attack(fighter.attack);
        }
      for (const event of this.world.events) {
        this.audio.impact(event.attack, event.blocked, event.victim);
        this.sparks.spawn(event);
        if (!this.menu?.reduceMotion)
          this.cameras.main.shake(
            event.final ? 250 : 90,
            event.blocked ? 0.0015 : 0.005,
            true,
          );
        if (event.final) this.slowRemaining = 900;
      }
      // Consume presentation events exactly once, including after the round ends.
      this.world.events = [];
      this.audio.health(
        this.world.player.health,
        this.world.dummy.health,
        this.world.result,
      );
    }
    this.draw();
    if (this.world.result && !this.testArena) this.menu.result(this.world.result);
  }
  drawFighter(f: Fighter, color: number) {
    const g = this.graphics,
      b = f.hurtbox;
    const hit = f.hitbox;
    if (this.debug) {
      g.lineStyle(1, 0x58e0c2);
      g.strokeRect(b.x, b.y, b.width, b.height);
      if (hit) {
        g.lineStyle(2, 0xff5c69);
        g.strokeRect(hit.x, hit.y, hit.width, hit.height);
      }
    }
  }
  draw() {
    this.touch.setMeter(this.world.player.meter);
    this.soundLabel.setText(
      this.audio.muted
        ? "SOUND OFF · TAP"
        : this.audio.context?.state === "running"
          ? "SOUND ON · TAP"
          : "TAP / KEY: ENABLE AUDIO",
    );
    this.announcement.setText(this.audio.caption);
    const g = this.graphics,
      w = this.world;
    g.clear();
    g.fillStyle(0x182332);
    g.fillRect(0, config.floor, 960, 110);
    g.lineStyle(1, 0x34465b);
    for (let x = 0; x < 960; x += 48) g.lineBetween(x, 180, x, 430);
    g.lineBetween(0, 430, 960, 430);
    for (const f of [w.player, w.dummy]) {
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(
        f.x,
        config.floor + 3,
        Math.max(28, 65 - (config.floor - f.y) * 0.2),
        12,
      );
    }
    this.views[0].render(w.player, w.result, this.endFrame);
    this.views[1].render(w.dummy, w.result, this.endFrame);
    this.effects.clear();
    for (const spark of this.sparks.items) {
      if (!spark.active) continue;
      const p = spark.age / 240;
      this.effects.lineStyle(3 * (1 - p), spark.blocked ? 0x89caff : 0xffe4a1, 1 - p);
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        this.effects.lineBetween(
          spark.x + Math.cos(a) * p * 20,
          spark.y + Math.sin(a) * p * 20,
          spark.x + Math.cos(a) * (10 + p * 44),
          spark.y + Math.sin(a) * (10 + p * 44),
        );
      }
    }
    g.fillStyle(0x2b3546);
    g.fillRect(28, 70, 360, 20);
    g.fillRect(572, 70, 360, 20);
    g.fillStyle(0x59d7c0);
    g.fillRect(28, 70, (360 * w.player.health) / 100, 20);
    g.fillStyle(0xefb866);
    g.fillRect(
      932 - (360 * w.dummy.health) / 100,
      70,
      (360 * w.dummy.health) / 100,
      20,
    );
    this.drawFighter(w.player, 0x59bba9);
    this.drawFighter(w.dummy, 0xd39b54);
    g.fillStyle(0x29394e);
    g.fillRect(28, 96, 360, 5);
    g.fillRect(572, 96, 360, 5);
    g.fillStyle(0x8e99ff);
    g.fillRect(28, 96, (360 * w.player.meter) / 100, 5);
    g.fillRect(932 - (360 * w.dummy.meter) / 100, 96, (360 * w.dummy.meter) / 100, 5);
    this.meterText.setText(
      `SUPER ${w.player.meter}/100${w.player.meter >= 100 ? " · L READY" : ""}                     PLACEHOLDER ART                     DUMMY SUPER ${w.dummy.meter}/100`,
    );
    this.clock.setText(String(Math.ceil(w.remaining / 60)).padStart(2, "0"));
    this.status.setText(
      w.result
        ? `${w.result}\nR TO RESET`
        : `PLAYER ${w.player.health} HP · ${w.player.machine.state.toUpperCase()}    /    DUMMY ${w.dummy.health} HP${w.dummyBlocks ? " · GUARD ON" : ""}\n${w.hitstop ? "HITSTOP" : w.lastHit}   |   ${w.player.comboDisplay > 0 && w.player.combo > 1 ? `${w.player.combo} HIT COMBO · ${w.player.comboDamage} DAMAGE` : "60 Hz SIMULATION"}`,
    );
  }
}
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: config.width,
  height: config.height,
  backgroundColor: "#10151f",
  scene: FightScene,
  fps: { target: 60, limit: 60 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
