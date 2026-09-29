// Each original atlas has eight poses in a 4-by-2 grid. Alpha bounds keep the
// feet on the Python floor despite differences in the exported empty margins.
const atlases = new Map();
const motion = new Map();
import { ease } from "./motion.js";
export const spriteReady = Promise.all(
  ["volt", "ember", "ghost", "subzero", "scorpion"].map(
    (kind) =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const w = Math.floor(image.naturalWidth / 4),
            h = Math.floor(image.naturalHeight / 2);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          const frames = [];
          for (let frame = 0; frame < 8; frame++) {
            context.clearRect(0, 0, w, h);
            context.drawImage(
              image,
              (frame % 4) * w,
              Math.floor(frame / 4) * h,
              w,
              h,
              0,
              0,
              w,
              h,
            );
            const pixels = context.getImageData(0, 0, w, h).data;
            let left = w,
              right = 0,
              top = h,
              bottom = 0;
            for (let y = 0; y < h; y++)
              for (let x = 0; x < w; x++)
                if (pixels[(y * w + x) * 4 + 3] > 60) {
                  left = Math.min(left, x);
                  right = Math.max(right, x);
                  top = Math.min(top, y);
                  bottom = Math.max(bottom, y);
                }
            let total = 0,
              count = 0;
            for (let y = top; y < top + (bottom - top) * 0.18; y++)
              for (let x = left; x <= right; x++)
                if (pixels[(y * w + x) * 4 + 3] > 100) {
                  total += x;
                  count++;
                }
            frames.push({
              left,
              right,
              top,
              bottom,
              anchor:
                frame === 4
                  ? left + (right - left) * 0.22
                  : count
                    ? total / count
                    : (left + right) / 2,
            });
          }
          if (frames[0].bottom > frames[0].top)
            atlases.set(kind, {
              image,
              w,
              h,
              frames,
              scale: 282 / (frames[0].bottom - frames[0].top),
            });
          window.dispatchEvent(new CustomEvent("fighter-art-ready", { detail: kind }));
          resolve();
        };
        image.onerror = () => resolve(); // Procedural renderer remains available offline.
        image.src = new URL(`../assets/${kind}-poses.png`, import.meta.url).href;
      }),
  ),
);
export function drawSprite(ctx, f, time, scale = 1, portrait = false) {
  const atlas = atlases.get(f.kind);
  if (!atlas) return false;
  const key = `${f.kind}:${f.facing}:${portrait ? "portrait" : (f.id ?? f.player ?? (f.facing > 0 ? "left" : "right"))}`;
  let pose = motion.get(key);
  if (!pose || time < pose.time || Math.abs(f.x - pose.x) > 120) {
    pose = { frame: 0, from: 0, changed: time, phase: 0, x: f.x, time };
    motion.set(key, pose);
  }
  const distance = Math.abs(f.x - pose.x);
  if (f.action === "walk") pose.phase += distance / 24;
  pose.x = f.x;
  pose.time = time;
  let frame = 0;
  if (f.action === "walk") frame = Math.sin(pose.phase) > 0 ? 1 : 2;
  else if (f.action === "punch")
    frame = f.action_time > 0.07 && f.action_time < 0.25 ? 3 : 0;
  else if (f.action === "kick")
    frame = f.action_time > 0.12 && f.action_time < 0.37 ? 4 : 0;
  else if (f.action === "block") frame = 5;
  else if (f.action === "special") frame = 7;
  else if (f.y < 534 && !portrait) frame = 6;
  if (frame !== pose.frame) {
    pose.from = pose.frame;
    pose.frame = frame;
    pose.changed = time;
  }
  const mix = portrait ? 1 : ease((time - pose.changed) / 0.065);
  const s = atlas.scale;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scale, scale);
  if (!portrait) {
    ctx.fillStyle = "#0009";
    ctx.beginPath();
    ctx.ellipse(0, 535 - f.y, 62, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.scale(f.facing || 1, 1);
  if (!portrait && f.action === "idle") {
    // Breathing, weight transfer and a small guard sway; feet remain anchored.
    ctx.translate(Math.sin(time * 1.7) * 1.4, 0);
    ctx.scale(1 + Math.sin(time * 2.6) * 0.002, 1 + Math.sin(time * 2.6) * 0.006);
    ctx.rotate(Math.sin(time * 1.7) * 0.004);
  } else if (!portrait && f.action === "walk") {
    ctx.scale(1, 1 - Math.abs(Math.sin(pose.phase)) * 0.012);
    ctx.rotate(Math.sin(pose.phase) * 0.012);
  } else if (!portrait && ["punch", "kick", "special"].includes(f.action)) {
    const duration = f.action === "kick" ? 0.48 : f.action === "special" ? 0.6 : 0.32;
    const progress = Math.min(1, f.action_time / duration);
    const drive = Math.sin(progress * Math.PI);
    ctx.translate(drive * 5, 0);
    ctx.rotate(drive * 0.025);
  }
  if (f.action === "ko") {
    ctx.translate(-25, -18);
    ctx.rotate(-1.4);
  }
  if (f.action === "hurt") {
    ctx.translate(-8, 0);
    ctx.rotate(-0.08);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (f.stun > 0.24)
    ctx.filter = "sepia(.6) hue-rotate(145deg) saturate(1.8) brightness(1.3)";
  const paint = (index, opacity) => {
    const bounds = atlas.frames[index];
    const croppedW = bounds.right - bounds.left + 1;
    const croppedH = bounds.bottom - bounds.top + 1;
    ctx.globalAlpha = opacity;
    ctx.drawImage(
      atlas.image,
      (index % 4) * atlas.w + bounds.left,
      Math.floor(index / 4) * atlas.h + bounds.top,
      croppedW,
      croppedH,
      (bounds.left - bounds.anchor) * s,
      -croppedH * s,
      croppedW * s,
      croppedH * s,
    );
  };
  if (mix < 1 && pose.from !== frame) paint(pose.from, 1 - mix);
  paint(frame, mix < 1 && pose.from !== frame ? mix : 1);
  ctx.restore();
  return true;
}
export function loadedSprites() {
  return [...atlases.keys()];
}

// Texture the articulated rig with the existing high-detail fighter artwork.
// Isolated walking-pose limbs are mapped between live joint positions.
export function drawRigSprite(ctx, f, pose, time, scale = 1) {
  const atlas = atlases.get(f.kind);
  if (!atlas) return false;
  const { image, w, h } = atlas;
  const fire = f.kind === "scorpion";
  const classic = !["subzero", "scorpion"].includes(f.kind);
  const sx = w / 384,
    sy = h / 512;
  const source = (x, y) => [w + x * sx, y * sy];
  function limb(sa, sb, a, b, width, sourceWidth) {
    const start = source(...sa),
      end = source(...sb);
    const sourceAngle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sourceLength = Math.hypot(end[0] - start[0], end[1] - start[1]);
    ctx.save();
    ctx.translate(...a);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-width * 0.3, -width / 2, length + width * 0.6, width, width * 0.43);
    ctx.clip();
    ctx.scale(length / sourceLength, width / (sourceWidth * sx));
    ctx.rotate(-sourceAngle);
    ctx.translate(-start[0], -start[1]);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }
  function patch(points, target) {
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    const left = Math.min(...xs),
      top = Math.min(...ys),
      width = Math.max(...xs) - left,
      height = Math.max(...ys) - top;
    ctx.save();
    ctx.translate(target[0], target[1]);
    ctx.scale(target[2] / width, target[3] / height);
    ctx.beginPath();
    points.forEach(([x, y], i) =>
      i ? ctx.lineTo(x - left, y - top) : ctx.moveTo(x - left, y - top),
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      image,
      w + left * sx,
      top * sy,
      width * sx,
      height * sy,
      0,
      0,
      width,
      height,
    );
    ctx.restore();
  }
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#0009";
  ctx.beginPath();
  ctx.ellipse(0, 535 - f.y, 60, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(f.facing || 1, 1);
  if (f.action === "ko") {
    ctx.translate(-32 * pose.fall, -16 * pose.fall);
    ctx.rotate(-1.42 * pose.fall);
  }
  ctx.translate(0, pose.bob);
  const leg = (hip, knee, foot) => {
    const sourceHip = classic ? [204, 260] : [220, 248];
    const sourceKnee = classic ? [243, 370] : [265, 348];
    const sourceAnkle = classic ? [272, 445] : [295, 441];
    limb(sourceHip, sourceKnee, hip, knee, 37, 65);
    limb(sourceKnee, sourceAnkle, knee, [foot[0], foot[1] - 14], 30, 49);
    patch(
      classic
        ? [
            [250, 434],
            [282, 434],
            [294, 453],
            [321, 451],
            [324, 476],
            [261, 498],
          ]
        : [
            [273, 420],
            [308, 419],
            [323, 449],
            [362, 458],
            [364, 478],
            [281, 481],
          ],
      [foot[0] - 17, foot[1] - 27, 60, 32],
    );
  };
  const arm = (shoulder, elbow, hand) => {
    limb(
      fire ? [200, 109] : classic ? [155, 109] : [170, 120],
      fire ? [211, 172] : classic ? [139, 182] : [146, 179],
      shoulder,
      elbow,
      30,
      48,
    );
    limb(
      fire ? [211, 172] : classic ? [139, 182] : [146, 179],
      fire ? [258, 231] : classic ? [130, 244] : [133, 246],
      elbow,
      hand,
      24,
      40,
    );
    patch(
      fire
        ? [
            [245, 218],
            [265, 219],
            [282, 237],
            [270, 252],
            [250, 248],
          ]
        : [
            [119, 231],
            [146, 231],
            [150, 265],
            [126, 280],
            [111, 263],
          ],
      [hand[0] - 12, hand[1] - 12, 30, 31],
    );
  };
  leg([-14, -117], pose.rearKnee, pose.rearFoot);
  ctx.save();
  ctx.translate(pose.lean, -115);
  ctx.rotate(pose.tilt);
  ctx.translate(0, 115);
  arm([-24, -211], pose.rearElbow, pose.rearHand);
  patch(
    fire
      ? [
          [183, 76],
          [225, 77],
          [251, 104],
          [248, 167],
          [230, 208],
          [158, 208],
          [161, 150],
        ]
      : [
          [174, 98],
          [216, 96],
          [237, 118],
          [236, 179],
          [218, 227],
          [158, 227],
          [164, 164],
        ],
    [-34, -233, 75, 125],
  );
  patch(
    fire
      ? [
          [225, 9],
          [258, 4],
          [286, 29],
          [280, 64],
          [263, 89],
          [233, 89],
          [208, 62],
        ]
      : [
          [181, 25],
          [219, 17],
          [242, 36],
          [244, 80],
          [227, 100],
          [193, 104],
          [176, 77],
        ],
    [-25, -283, 51, 67],
  );
  arm([24, -211], pose.elbow, pose.hand);
  if (["special", "xpower", "finisher"].includes(f.action)) {
    const radius = f.action === "special" ? 15 : 29;
    const glow = ctx.createRadialGradient(
      pose.hand[0],
      pose.hand[1],
      1,
      pose.hand[0],
      pose.hand[1],
      radius,
    );
    glow.addColorStop(0, "#ffffffee");
    glow.addColorStop(0.3, f.kind === "subzero" ? "#72d8ffc0" : "#ffb34ec0");
    glow.addColorStop(1, "#ffffff00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(...pose.hand, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  leg([13, -117], pose.knee, pose.foot);
  patch(
    fire
      ? [
          [218, 212],
          [248, 217],
          [253, 303],
          [237, 338],
          [217, 318],
        ]
      : [
          [165, 219],
          [218, 218],
          [221, 281],
          [195, 326],
          [169, 285],
        ],
    [-20, -123, 45, 89],
  );
  ctx.restore();
  return true;
}
