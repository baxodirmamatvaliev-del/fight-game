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
