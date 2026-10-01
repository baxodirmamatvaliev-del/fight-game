export interface Spark {
  x: number;
  y: number;
  age: number;
  blocked: boolean;
  active: boolean;
}
// Fixed capacity: no allocation/filtering for particles in the combat loop.
export class SparkPool {
  readonly items: Spark[];
  private cursor = 0;
  constructor(capacity = 24) {
    this.items = Array.from({ length: capacity }, () => ({
      x: 0,
      y: 0,
      age: 0,
      blocked: false,
      active: false,
    }));
  }
  spawn(event: { x: number; y: number; blocked: boolean }) {
    const s = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    s.x = event.x;
    s.y = event.y;
    s.blocked = event.blocked;
    s.age = 0;
    s.active = true;
  }
  update(ms: number) {
    for (const s of this.items)
      if (s.active) {
        s.age += ms;
        if (s.age >= 240) s.active = false;
      }
  }
  clear() {
    for (const s of this.items) s.active = false;
    this.cursor = 0;
  }
  get length() {
    let n = 0;
    for (const s of this.items) if (s.active) n++;
    return n;
  }
}
