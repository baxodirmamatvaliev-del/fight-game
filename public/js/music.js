// Original 112 BPM synth pattern, generated in-browser without audio downloads.
export class Music {
  constructor(audio) {
    this.audio = audio;
    this.timer = null;
    this.step = 0;
    this.next = 0;
    this.intense = false;
  }
  start() {
    if (this.timer || !this.audio.ctx || !this.audio.musicEnabled) return;
    this.step = 0;
    this.next = this.audio.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 60);
    this.schedule();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  schedule() {
    const a = this.audio;
    if (!a.ctx || !a.musicEnabled) {
      this.stop();
      return;
    }
    if (a.ctx.state !== "running") return;
    const length = 60 / 92 / 4;
    const bass = [
      55, 55, 65.41, 55, 49, 49, 65.41, 73.42, 43.65, 43.65, 55, 65.41, 49, 49,
      73.42, 65.41,
    ];
    let guard = 0;
    while (this.next < a.ctx.currentTime + 0.17 && guard++ < 8) {
      const delay = Math.max(0, this.next - a.ctx.currentTime),
        s = this.step % 32;
      if (s % 4 === 0) {
        a.tone(125, 0.12, "sine", this.intense ? 0.14 : 0.08, 32, delay);
      }
      if (s % 8 === 4)
        a.noise(0.085, this.intense ? 0.055 : 0.027, 1000, delay);
      if (s % 4 === 2) a.noise(0.045, 0.012, 4200, delay);
      if (s % 2 === 0)
        a.tone(bass[(s / 2) | 0], length * 1.5, "triangle", 0.065, null, delay);
      if (s % 16 === 0) {
        const notes = [220, 261.63, 329.63, 293.66, 196, 261.63, 220, 293.66];
        a.tone(
          notes[(s / 4) | 0] / 2,
          length * 8,
          "sine",
          0.035,
          null,
          delay,
        );
      }
      this.step++;
      this.next += length;
    }
    if (this.next < a.ctx.currentTime) this.next = a.ctx.currentTime + 0.05;
  }
}
