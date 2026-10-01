import type { AttackName } from "./config";
export const audioFiles = {
  punch: "impact-punch.wav",
  kick: "impact-kick.wav",
  block: "impact-block.wav",
  whoosh: "whoosh.wav",
  special: "special.wav",
  super: "super.wav",
  playerGrunt: "player-grunt.wav",
  dummyGrunt: "dummy-grunt.wav",
  music: "stage-music.wav",
  round: "announcer-round-1-fight.wav",
  finish: "announcer-finish-him.wav",
  flawless: "announcer-flawless-victory.wav",
} as const;
type Sound = keyof typeof audioFiles;
const words = {
  round: "Round 1, Fight!",
  finish: "Finish Him!",
  flawless: "Flawless Victory",
};

// All default effects/music are original Web Audio synthesis. Spoken defaults
// use the device's speech engine; provide recordings for consistent mobile voices.
export class AudioManager {
  context: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  muted = false;
  volume = 0.6;
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.context)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.context.currentTime,
        0.015,
      );
  }
  caption = "";
  deferRound() {
    this.roundPending = false;
    this.caption = "";
  }
  played: Partial<Record<Sound, number>> = {};
  private master!: GainNode;
  private buffers = new Map<Sound, AudioBuffer>();
  private sources = new Set<AudioScheduledSourceNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private paused = false;
  private disposed = false;
  private roundPending = true;
  private finishSaid = false;
  private resultSaid = false;
  private loaded = false;
  private musicSource: AudioBufferSourceNode | null = null;
  private gesture = () => {
    void this.unlock();
  };
  constructor() {
    window.addEventListener("pointerdown", this.gesture);
    window.addEventListener("keydown", this.gesture);
  }
  async unlock() {
    if (this.disposed) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -18;
        limiter.ratio.value = 8;
        this.analyser = this.context.createAnalyser();
        this.master.connect(limiter);
        limiter.connect(this.analyser);
        this.analyser.connect(this.context.destination);
      }
      await this.context.resume();
      if (this.disposed || this.paused) return;
      if (!this.loaded) {
        this.loaded = true;
        void this.loadOverrides();
      }
      if (!this.timer) this.timer = setInterval(() => this.musicTick(), 250);
      if (this.roundPending) {
        this.roundPending = false;
        this.announce("round");
      }
    } catch {
      this.caption = "Tap to enable audio";
    }
  }
  private async loadOverrides() {
    // Missing files generate no network requests. Vite discovers optional assets.
    const files = import.meta.glob("./assets/audio/*.wav", {
      eager: true,
      query: "?url",
      import: "default",
    }) as Record<string, string>;
    await Promise.all(
      Object.entries(audioFiles).map(async ([key, name]) => {
        const url = files[`./assets/audio/${name}`];
        if (!url || !this.context) return;
        try {
          const response = await fetch(url);
          if (!response.ok) return;
          const buffer = await this.context.decodeAudioData(
            await response.arrayBuffer(),
          );
          if (!this.disposed) this.buffers.set(key as Sound, buffer);
        } catch {
          /* Keep synthesis fallback for missing/invalid recordings. */
        }
      }),
    );
  }
  private available() {
    return (
      this.context?.state === "running" && !this.muted && !this.paused && !this.disposed
    );
  }
  private track(source: AudioScheduledSourceNode) {
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
    };
  }
  private tone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    end = frequency,
  ) {
    if (!this.available()) return;
    const c = this.context!,
      o = c.createOscillator(),
      g = c.createGain(),
      now = c.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(frequency, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g);
    g.connect(this.master);
    this.track(o);
    o.start();
    o.stop(now + duration + 0.01);
    o.addEventListener("ended", () => g.disconnect());
  }
  private noise(duration: number, frequency: number, volume: number) {
    if (!this.available()) return;
    const c = this.context!,
      b = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate),
      data = b.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    f.type = "bandpass";
    f.frequency.value = frequency;
    g.gain.value = volume;
    s.buffer = b;
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    this.track(s);
    s.addEventListener("ended", () => {
      f.disconnect();
      g.disconnect();
    });
    s.start();
  }
  play(key: Sound) {
    if (!this.available()) return;
    this.played[key] = (this.played[key] || 0) + 1;
    const buffer = this.buffers.get(key);
    if (buffer) {
      const s = this.context!.createBufferSource();
      s.buffer = buffer;
      s.connect(this.master);
      this.track(s);
      s.start();
      return;
    }
    if (key === "whoosh") this.noise(0.15, 1600, 0.3);
    else if (key === "punch" || key === "kick" || key === "block") {
      this.tone(key === "block" ? 320 : 110, 0.16, 0.35, "sine", 45);
      this.noise(0.12, key === "block" ? 2400 : 850, 0.5);
    } else if (key === "special" || key === "super") {
      this.tone(100, key === "super" ? 0.7 : 0.4, 0.18, "sawtooth", 700);
      this.noise(0.35, 1200, 0.25);
    } else if (key === "playerGrunt" || key === "dummyGrunt") {
      const pitch = key === "playerGrunt" ? 160 : 105;
      this.tone(pitch, 0.23, 0.13, "sawtooth", pitch * 0.65);
      this.tone(pitch * 3, 0.18, 0.06, "sine", pitch * 2);
      this.noise(0.16, 550, 0.13);
    }
  }
  attack(attack: AttackName) {
    this.play("whoosh");
    if (attack === "special" || attack === "super") this.play(attack);
  }
  impact(attack: AttackName, blocked: boolean, victim: "player" | "dummy") {
    this.play(blocked ? "block" : attack === "punch" ? "punch" : "kick");
    if (!blocked) this.play(victim === "player" ? "playerGrunt" : "dummyGrunt");
  }
  private announce(key: keyof typeof words) {
    this.caption = words[key];
    if (!this.available()) return;
    if (this.buffers.has(key)) {
      this.play(key);
      return;
    }
    this.played[key] = (this.played[key] || 0) + 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(words[key]);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 0.65;
      utterance.volume = this.volume;
      window.speechSynthesis.speak(utterance);
    }
  }
  health(player: number, dummy: number, result: string) {
    if (
      !this.finishSaid &&
      !result &&
      ((dummy > 0 && dummy <= 20) || (player > 0 && player <= 20))
    ) {
      this.finishSaid = true;
      this.announce("finish");
    }
    if (result && !this.resultSaid) {
      this.resultSaid = true;
      if (
        (result === "PLAYER WINS" && player === 100) ||
        (result === "DUMMY WINS" && dummy === 100)
      )
        this.announce("flawless");
    }
  }
  private musicTick() {
    if (!this.available()) return;
    const buffer = this.buffers.get("music");
    if (buffer) {
      if (!this.musicSource) {
        const s = this.context!.createBufferSource();
        s.buffer = buffer;
        s.loop = true;
        const g = this.context!.createGain();
        g.gain.value = 0.2;
        s.connect(g);
        g.connect(this.master);
        this.track(s);
        s.addEventListener("ended", () => g.disconnect());
        s.start();
        this.musicSource = s;
      }
      return;
    }
    const notes = [55, 55, 65.41, 55, 73.42, 65.41, 49, 49];
    this.tone(notes[this.beat % 8], 0.23, 0.07, "triangle");
    if (this.beat % 2 === 0) this.tone(85, 0.09, 0.09, "sine", 35);
    this.beat++;
  }
  setMuted(value: boolean) {
    this.muted = value;
    if (this.context)
      this.master.gain.setTargetAtTime(
        value ? 0 : this.volume,
        this.context.currentTime,
        0.015,
      );
    if (value && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  pause() {
    this.paused = true;
    this.stop();
    void this.context?.suspend();
  }
  resume() {
    this.paused = false; /* Resume only in a new user gesture. */
  }
  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already ended */
      }
    }
    this.sources.clear();
    this.musicSource = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  reset() {
    this.stop();
    this.finishSaid = false;
    this.resultSaid = false;
    this.roundPending = true;
    this.caption = "";
    this.beat = 0;
    void this.unlock();
  }
  destroy() {
    this.disposed = true;
    this.stop();
    window.removeEventListener("pointerdown", this.gesture);
    window.removeEventListener("keydown", this.gesture);
    void this.context?.close();
  }
}
