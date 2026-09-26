// Each original atlas has eight poses in a 4-by-2 grid. Alpha bounds keep the
// feet on the Python floor despite differences in the exported empty margins.
const atlases = new Map();
export const spriteReady = Promise.all(
  ["volt", "ember", "ghost"].map(
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
          window.dispatchEvent(
            new CustomEvent("fighter-art-ready", { detail: kind }),
          );
          resolve();
        };
        image.onerror = () => resolve(); // Procedural renderer remains available offline.
        image.src = new URL(
          `../assets/${kind}-poses.png`,
          import.meta.url,
        ).href;
      }),
  ),
);
export function drawSprite(ctx, f, time, scale = 1, portrait = false) {
  const atlas = atlases.get(f.kind);
  if (!atlas) return false;
  let frame = 0;
  if (f.action === "walk") frame = Math.sin(time * 15) > 0 ? 1 : 2;
  else if (f.action === "punch")
    frame = f.action_time > 0.07 && f.action_time < 0.25 ? 3 : 0;
  else if (f.action === "kick")
    frame = f.action_time > 0.12 && f.action_time < 0.37 ? 4 : 0;
  else if (f.action === "block") frame = 5;
  else if (f.action === "special") frame = 7;
  else if (f.y < 534 && !portrait) frame = 6;
  const bounds = atlas.frames[frame],
    s = atlas.scale;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scale, scale);
  if (!portrait && f.y >= 534 && f.action === "idle")
    ctx.translate(0, Math.sin(time * 2.6) * 1.2);
  if (!portrait) {
    ctx.fillStyle = "#0009";
    ctx.beginPath();
    ctx.ellipse(0, 535 - f.y, 62, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.scale(f.facing || 1, 1);
  if (f.action === "ko") {
    ctx.translate(-25, -18);
    ctx.rotate(-1.4);
  }
  if (f.action === "hurt") {
    ctx.translate(-8, 0);
    ctx.rotate(-0.08);
  }
  const croppedW = bounds.right - bounds.left + 1,
    croppedH = bounds.bottom - bounds.top + 1;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    atlas.image,
    (frame % 4) * atlas.w + bounds.left,
    Math.floor(frame / 4) * atlas.h + bounds.top,
    croppedW,
    croppedH,
    (bounds.left - bounds.anchor) * s,
    -croppedH * s,
    croppedW * s,
    croppedH * s,
  );
  ctx.restore();
  return true;
}
export function loadedSprites() {
  return [...atlases.keys()];
}
