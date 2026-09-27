export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.65;
    this.muted = false;
    this.musicEnabled = true;
    this.music = null;
  }
  async unlock() {
    if (!this.ctx) {
      const Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) return;
      this.ctx = new Constructor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }
  setVolume(value) {
    this.volume = value;
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : value,
        this.ctx.currentTime,
        0.04,
      );
  }
  setMuted(muted) {
    this.muted = muted;
    this.setVolume(this.volume);
  }
  tone(
    frequency,
    duration = 0.1,
    type = "sine",
    gain = 0.12,
    slide = null,
    when = 0,
  ) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(frequency, t);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, slide),
        t + duration,
      );
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.01);
  }
  noise(duration = 0.1, gain = 0.1, highpass = 500, when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when,
      buffer = this.ctx.createBuffer(
        1,
        Math.ceil(this.ctx.sampleRate * duration),
        this.ctx.sampleRate,
      ),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const n = this.ctx.createBufferSource(),
      g = this.ctx.createGain(),
      filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpass;
    n.buffer = buffer;
    g.gain.value = gain;
    n.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    n.start(t);
    n.stop(t + duration);
  }
  play(type, event = {}) {
    if (type === "hit") {
      const heavy = event.special || event.damage >= 10;
      this.tone(heavy ? 82 : 135, heavy ? 0.28 : 0.16, "sine", 0.34, 28);
      this.noise(heavy ? 0.18 : 0.095, 0.24, heavy ? 180 : 650);
      this.noise(0.045, 0.13, 2200);
    }
    if (type === "block") {
      this.tone(560, 0.09, "triangle", 0.13, 150);
      this.noise(0.055, 0.12, 1800);
    }
    if (type === "special") {
      this.tone(160, 0.4, "sawtooth", 0.09, 960);
      this.tone(80, 0.3, "sine", 0.16, 300);
      this.noise(0.3, 0.1, 1200);
    }
    if (type === "fight") {
      this.tone(58, 0.65, "sine", 0.24, 28);
      this.noise(0.42, 0.13, 230);
      this.tone(116, 0.45, "triangle", 0.08, 58, 0.1);
    }
    if (type === "ko") {
      this.tone(80, 0.65, "sine", 0.3, 25);
      this.noise(0.4, 0.2, 100);
    }
    if (type === "victory") {
      [73.42, 110, 146.83].forEach((n, i) =>
        this.tone(n, 0.65, "triangle", 0.1, null, i * 0.18),
      );
    }
    if (type === "select") this.tone(740, 0.06, "triangle", 0.08, 980);
    if (type === "jump") this.noise(0.14, 0.055, 900);
  }
  suspendMusic() {
    this.music?.stop();
  }
}
