import Phaser from "phaser";
import type { Fighter } from "./Fighter";
import { config } from "./config";

// TODO(ART): Replace this generated 192x160 atlas with hand-drawn PNG frames.
// Preserve clip order, 8 frames per clip packed in 10 columns, feet pivot (96,144).
// These are deliberately simple placeholder silhouettes, not production art.
export const clips = [
  "idle",
  "walk",
  "jump",
  "crouch",
  "block",
  "punch",
  "kick",
  "hit",
  "knockdown",
  "getup",
  "victory",
  "death",
  "special",
  "super",
] as const;
type Clip = (typeof clips)[number];
const W = 192,
  H = 160,
  COUNT = 8;

export function createPlaceholderSheet(scene: Phaser.Scene) {
  if (scene.textures.exists("fighter-placeholder")) return;
  const canvas = document.createElement("canvas");
  // 1920×1920 atlas stays under the 2048 texture limit of older phones.
  const columns = 10;
  canvas.width = W * columns;
  canvas.height = H * Math.ceil((COUNT * clips.length) / columns);
  const c = canvas.getContext("2d")!;
  clips.forEach((clip, row) => {
    for (let frame = 0; frame < COUNT; frame++) {
      const index = row * COUNT + frame,
        x = (index % columns) * W,
        y = Math.floor(index / columns) * H;
      c.save();
      c.beginPath();
      c.rect(x, y, W, H);
      c.clip();
      c.translate(x + 96, y + 144);
      const t = frame / (COUNT - 1),
        wave = Math.sin(t * Math.PI * 2);
      let head = [2, -100],
        hip = [-3, -49],
        shoulder = [0, -79];
      let hands = [
          [-19, -66],
          [24, -82],
        ],
        knees = [
          [-19, -27],
          [18, -25],
        ],
        feet = [
          [-27, -3],
          [26, -3],
        ];
      if (clip === "idle") {
        c.translate(0, wave * 2);
      }
      if (clip === "walk") {
        feet = [
          [-28 * wave, -3 - Math.max(0, wave) * 12],
          [28 * wave, -3 - Math.max(0, -wave) * 12],
        ];
        knees = [
          [-18 * wave, -29],
          [18 * wave, -29],
        ];
        hands = [
          [-20, -65 + wave * 10],
          [22, -77 - wave * 8],
        ];
        c.translate(0, -Math.abs(wave) * 3);
      }
      if (clip === "jump") {
        knees = [
          [-25, -46],
          [28, -53],
        ];
        feet = [
          [-20, -24],
          [38, -35],
        ];
        hands = [
          [-28, -89],
          [29, -100],
        ];
      }
      if (clip === "crouch") {
        head = [8, -57];
        shoulder = [5, -38];
        hip = [-12, -22];
        knees = [
          [-27, -14],
          [24, -15],
        ];
        hands = [
          [-7, -35],
          [30, -48],
        ];
      }
      if (clip === "block") {
        hands = [
          [18, -109],
          [33, -89],
        ];
        head = [-7, -99];
      }
      if (["punch", "special", "super"].includes(clip)) {
        const extension = [0, 0.15, 0.4, 1, 1, 0.75, 0.3, 0][frame];
        hands = [
          [4, -77],
          [26 + extension * 58, -88],
        ];
        shoulder = [extension * 8, -79];
        head = [extension * 5, -102];
        if (clip !== "punch") hands[0] = [24 + extension * 50, -65];
      }
      if (clip === "kick") {
        const extension = [0, 0.1, 0.4, 1, 1, 0.7, 0.25, 0][frame];
        head = [-extension * 18, -100];
        shoulder = [-extension * 15, -80];
        knees[1] = [20 + extension * 25, -25 - extension * 23];
        feet[1] = [26 + extension * 62, -3 - extension * 42];
        hands = [
          [-30, -72],
          [14, -95],
        ];
      }
      if (clip === "hit") {
        c.rotate(-0.12 - Math.sin(t * Math.PI) * 0.2);
        head = [-12, -98];
        hands = [
          [-32, -85],
          [35, -70],
        ];
      }
      if (clip === "knockdown" || clip === "death" || clip === "getup") {
        const fall = clip === "getup" ? 1 - t : Math.min(1, t * 1.8);
        c.translate(fall * 40, -fall * 3);
        c.rotate((-fall * Math.PI) / 2);
        hands = [
          [-25, -65],
          [30, -65],
        ];
      }
      if (clip === "victory") {
        hands = [
          [-28, -123],
          [29, -132 + wave * 5],
        ];
        head = [0, -104];
      }
      const limb = (points: number[][], color: string, width: number) => {
        c.strokeStyle = color;
        c.lineWidth = width;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
      };
      limb([hip, knees[0], feet[0]], "#718295", 13);
      limb([shoulder, [-25, -65], hands[0]], "#718295", 11);
      limb([hip, shoulder], "#e1e8ef", 27);
      limb([hip, knees[1], feet[1]], "#d2dce7", 14);
      limb([shoulder, [(shoulder[0] + hands[1][0]) / 2, -65], hands[1]], "#eaf0f6", 12);
      c.fillStyle = "#edf3fa";
      c.beginPath();
      c.arc(head[0], head[1], 13, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#202c42";
      c.fillRect(head[0] - 4, head[1] - 5, 16, 6);
      limb(
        [
          [-15, hip[1]],
          [12, hip[1]],
        ],
        "#34465b",
        8,
      );
      if (clip === "special" || clip === "super") {
        c.strokeStyle = clip === "super" ? "#ffffff" : "#9ce9ff";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(hands[1][0], hands[1][1], 9 + frame * 2, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
  });
  const texture = scene.textures.addCanvas("fighter-placeholder", canvas)!;
  clips.forEach((_clip, row) => {
    for (let f = 0; f < COUNT; f++)
      texture.add(
        row * COUNT + f,
        0,
        ((row * COUNT + f) % columns) * W,
        Math.floor((row * COUNT + f) / columns) * H,
        W,
        H,
      );
  });
}

export class SpriteFighter {
  sprite: Phaser.GameObjects.Sprite;
  constructor(scene: Phaser.Scene, color: number) {
    this.sprite = scene.add
      .sprite(0, 0, "fighter-placeholder", 0)
      .setOrigin(0.5, 0.9)
      .setTint(color)
      .setDepth(2);
  }
  render(f: Fighter, result: string, endFrame: number) {
    let clip: Clip;
    const state = f.machine.state;
    if (
      result &&
      f.health > 0 &&
      result !== "DRAW" &&
      (result === "PLAYER WINS") === (this.sprite.getData("player") === true)
    )
      clip = "victory";
    else
      clip =
        state === "ko"
          ? "death"
          : state === "hitstun"
            ? "hit"
            : state === "blockstun"
              ? "block"
              : state === "getup"
                ? "getup"
                : (state as Clip);
    let frame: number;
    if (f.attack && !result) {
      const a = config.attacks[f.attack];
      const n = f.machine.frame;
      frame =
        n < a.startup
          ? Math.min(2, Math.floor((n / a.startup) * 3))
          : n < a.startup + a.active
            ? 3 + Math.min(1, Math.floor(((n - a.startup) / a.active) * 2))
            : Math.min(
                7,
                5 + Math.floor(((n - a.startup - a.active) / a.recovery) * 3),
              );
    } else if (clip === "death" || clip === "victory")
      frame =
        clip === "death"
          ? Math.min(7, Math.floor(endFrame / 5))
          : Math.floor(endFrame / 6) % 8;
    else if (clip === "knockdown" || clip === "getup")
      frame = Math.min(7, Math.floor(f.machine.frame / (clip === "getup" ? 3 : 4)));
    else frame = Math.floor(f.machine.frame / (clip === "walk" ? 4 : 7)) % 8;
    this.sprite
      .setPosition(f.x, f.y)
      .setFlipX(f.facing < 0)
      .setFrame(clips.indexOf(clip) * 8 + frame);
  }
}
