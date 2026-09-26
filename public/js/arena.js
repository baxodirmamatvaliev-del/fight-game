const W = 1200,
  H = 640,
  FLOOR = 535;
const rand = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const palettes = {
  city: ["#090e22", "#282342", "#fa5bc7", "#48d9ee"],
  temple: ["#130c20", "#642839", "#ff8c62", "#ffc478"],
  void: ["#080a22", "#29254d", "#ae7cff", "#6debff"],
};
export const arenaNames = {
  city: "01 / TUNGI ZAVOD",
  temple: "02 / QIZIL PECH",
  void: "03 / SOVUQ SEKTOR",
};
const foundry = new Image();
foundry.src = new URL("../assets/foundry-arena.png", import.meta.url).href;

function glow(ctx, color, blur, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  fn();
  ctx.restore();
}
function line(ctx, x, y, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function building(ctx, x, y, w, h, color, seed, lights) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#121629";
  ctx.fillRect(x - 3, y, w + 6, 5);
  for (let row = 0; row < h / 18 - 1; row++)
    for (let col = 0; col < w / 14 - 1; col++) {
      const value = rand(seed + row * 23 + col * 3);
      ctx.fillStyle =
        value > 0.74 ? lights : value > 0.38 ? "#434361" : "#1b2236";
      ctx.globalAlpha = value > 0.74 ? 0.6 : 1;
      ctx.fillRect(x + 8 + col * 14, y + 11 + row * 18, 5, 8);
    }
  ctx.globalAlpha = 1;
}
function city(ctx, t) {
  const moon = ctx.createRadialGradient(856, 105, 4, 856, 105, 92);
  moon.addColorStop(0, "#b9a6df33");
  moon.addColorStop(1, "#b9a6df00");
  ctx.fillStyle = moon;
  ctx.fillRect(755, 0, 210, 210);
  ctx.fillStyle = "#c6bad55c";
  ctx.beginPath();
  ctx.arc(856, 105, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#25213e";
  ctx.beginPath();
  ctx.arc(867, 98, 31, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 24; i++) {
    const w = 30 + rand(i) * 65,
      h = 50 + rand(i + 22) * 155;
    building(ctx, i * 54 - 20, 380 - h, w, h, "#161a32", i, "#9ea1df");
  }
  for (let i = 0; i < 10; i++) {
    const w = 70 + rand(i + 87) * 75,
      h = 120 + rand(i + 77) * 150;
    building(ctx, i * 140 - 30, 430 - h, w, h, "#15182a", i + 120, "#bb78c5");
  }
  building(ctx, -20, 108, 170, 427, "#121728", 444, "#599da8");
  building(ctx, 1000, 120, 220, 415, "#141326", 613, "#ae78af");
  building(ctx, 160, 280, 150, 255, "#111424", 811, "#a98666");
  building(ctx, 880, 270, 110, 265, "#10162a", 345, "#5eb6bc");
  for (const [x, y, text, color, vertical] of [
    [82, 221, "夜の街", "#fb70bf", true],
    [1035, 212, "NEON", "#5ee7ed", true],
    [209, 321, "OPEN LATE", "#f793bd", false],
    [931, 342, "24 H", "#50cfce", true],
  ]) {
    glow(ctx, color, 18, () => {
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 12, y - 22, vertical ? 42 : 85, vertical ? 125 : 34);
      ctx.font = vertical ? "20px sans-serif" : "12px monospace";
      if (vertical) [...text].forEach((s, i) => ctx.fillText(s, x, y + i * 27));
      else ctx.fillText(text, x - 6, y);
    });
  }
  ctx.fillStyle = "#111722";
  ctx.fillRect(0, 449, W, 87);
  line(ctx, 0, 449, W, 449, "#57536d", 3);
  for (let x = 0; x < W; x += 53) {
    line(ctx, x, 454, x, 529, "#343346");
    line(ctx, x + 1, 460, x + 47, 460, "#2e3041");
  }
  line(ctx, 0, 476, W, 476, "#292b3e", 3);
  for (const x of [338, 859]) {
    ctx.fillStyle = "#141522";
    ctx.fillRect(x, 310, 5, 140);
    glow(ctx, "#fb8ee7", 24, () => {
      ctx.fillRect(x - 28, 310, 62, 4);
    });
  }
  const haze = ctx.createLinearGradient(0, 390, 0, 535);
  haze.addColorStop(0, "#8c407200");
  haze.addColorStop(1, "#77568828");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 390, W, 145);
  ctx.strokeStyle = "#8bacc61c";
  ctx.lineWidth = 1;
  for (let i = 0; i < 95; i++) {
    const x = rand(i + 400) * W,
      y = (rand(i + 800) * H + t * 240) % H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4, y + 13);
    ctx.stroke();
  }
}
function temple(ctx, t) {
  const moon = ctx.createRadialGradient(600, 170, 15, 600, 170, 230);
  moon.addColorStop(0, "#e98b5555");
  moon.addColorStop(1, "#e98b5500");
  ctx.fillStyle = moon;
  ctx.fillRect(300, 0, 600, 400);
  ctx.fillStyle = "#ea9472";
  ctx.beginPath();
  ctx.arc(600, 170, 60, 0, 7);
  ctx.fill();
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ["#372335", "#2e2031", "#211c2d"][layer];
    ctx.beginPath();
    ctx.moveTo(0, 480);
    for (let x = 0; x <= W; x += 40)
      ctx.lineTo(
        x,
        335 +
          layer * 25 -
          Math.sin(x * 0.012 + layer) * 50 -
          rand(x + layer * 44) * 40,
      );
    ctx.lineTo(W, 535);
    ctx.lineTo(0, 535);
    ctx.fill();
  }
  for (const x of [130, 965]) {
    ctx.fillStyle = "#3a202c";
    ctx.fillRect(x, 215, 32, 320);
    ctx.fillRect(x - 12, 213, 58, 18);
    ctx.fillStyle = "#6a3840";
    ctx.fillRect(x + 5, 239, 6, 286);
  }
  ctx.fillStyle = "#492631";
  ctx.fillRect(130, 212, 867, 24);
  ctx.beginPath();
  ctx.moveTo(80, 190);
  ctx.quadraticCurveTo(250, 228, 390, 197);
  ctx.lineTo(820, 197);
  ctx.quadraticCurveTo(955, 228, 1045, 190);
  ctx.lineTo(998, 236);
  ctx.lineTo(132, 236);
  ctx.closePath();
  ctx.fill();
  for (const x of [80, 330, 870, 1120]) {
    line(ctx, x, 0, x, 290, "#77434b");
    glow(ctx, "#ff6a47", 30, () => {
      ctx.beginPath();
      ctx.ellipse(x, 300 + Math.sin(t + x) * 3, 18, 27, 0, 0, 7);
      ctx.fill();
    });
    line(ctx, x, 280, x, 320, "#63252c", 3);
  }
  ctx.fillStyle = "#201723";
  ctx.fillRect(0, 488, W, 47);
  for (let x = 0; x < W; x += 80) {
    ctx.fillStyle = "#393039";
    ctx.fillRect(x, 491, 70, 32);
  }
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = "#fa9e7899";
    const x = (rand(i + 16) * W + t * (15 + rand(i) * 20)) % W,
      y = (rand(i + 100) * 500 - t * 10) % 500;
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 2, t + i, 0, 7);
    ctx.fill();
  }
}
function voidArena(ctx, t) {
  const earth = ctx.createRadialGradient(710, 270, 0, 710, 270, 250);
  earth.addColorStop(0, "#544693");
  earth.addColorStop(0.72, "#272255");
  earth.addColorStop(0.95, "#69aaff");
  earth.addColorStop(1, "#16224000");
  ctx.fillStyle = earth;
  ctx.fillRect(445, 0, 530, 535);
  ctx.save();
  ctx.beginPath();
  ctx.arc(710, 270, 230, 0, 7);
  ctx.clip();
  ctx.strokeStyle = "#8c79bc44";
  ctx.lineWidth = 20;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.ellipse(710 + i * 17, 110 + i * 52, 190, 25, -0.3, 0, 7);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "#a492c137";
  ctx.lineWidth = 7;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 300 - 100, 0);
    ctx.lineTo(i * 300 + 50, 420);
    ctx.stroke();
  }
  line(ctx, 0, 419, W, 419, "#5b5f85", 9);
  for (const x of [0, 1120]) {
    ctx.fillStyle = "#19172e";
    ctx.fillRect(x, 0, 80, 535);
    glow(ctx, "#a784ff", 20, () => ctx.fillRect(x + 34, 0, 3, 535));
  }
  ctx.fillStyle = "#151728";
  ctx.fillRect(0, 439, W, 96);
  for (let x = 100; x < W; x += 210) {
    ctx.strokeStyle = "#71668e";
    ctx.strokeRect(x, 460, 125, 40);
    glow(ctx, "#6ce6e6", 9, () => {
      for (let j = 0; j < 4; j++) ctx.fillRect(x + 10 + j * 25, 475, 15, 3);
    });
  }
  const orbit = ((t * 45) % 1500) - 150;
  glow(ctx, "#c7baff", 12, () => {
    ctx.fillRect(orbit, 96, 70, 2);
    ctx.fillRect(orbit + 70, 94, 4, 6);
  });
}
export function drawArena(ctx, kind, t, reduced = false) {
  if (foundry.complete && foundry.naturalWidth) {
    ctx.save();
    ctx.filter =
      kind === "void"
        ? "saturate(.45) hue-rotate(165deg)"
        : kind === "temple"
          ? "saturate(.9) sepia(.25)"
          : "saturate(.7)";
    ctx.drawImage(foundry, 0, 0, W, H);
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "#03080dbb");
    shade.addColorStop(0.45, "#03080d22");
    shade.addColorStop(1, "#03080d66");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    if (!reduced)
      for (let i = 0; i < 22; i++) {
        const x = (rand(i + 10) * W + t * (8 + rand(i) * 11)) % W,
          y = 300 + ((rand(i + 50) * 290 - t * 8) % 290);
        ctx.fillStyle = kind === "void" ? "#acd0e040" : "#e7ab7440";
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    return;
  }
  const p = palettes[kind] || palettes.city;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, p[0]);
  sky.addColorStop(0.75, p[1]);
  sky.addColorStop(1, "#080c14");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 75; i++) {
    ctx.fillStyle = `rgba(220,210,255,${0.15 + rand(i + 2) * 0.45})`;
    ctx.fillRect(rand(i) * W, rand(i + 180) * 300, 1.2, 1.2);
  }
  if (kind === "temple") temple(ctx, reduced ? 0 : t);
  else if (kind === "void") voidArena(ctx, reduced ? 0 : t);
  else city(ctx, reduced ? 0 : t);
  const floor = ctx.createLinearGradient(0, FLOOR, 0, H);
  floor.addColorStop(0, "#343342");
  floor.addColorStop(0.1, "#181c29");
  floor.addColorStop(1, "#080d15");
  ctx.fillStyle = floor;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  glow(ctx, p[3], 9, () => ctx.fillRect(0, FLOOR, W, 2));
  for (let y = 549; y < H; y += 18) {
    line(ctx, 0, y, W, y, "#69718418");
  }
  for (let x = -400; x < 1600; x += 95)
    line(ctx, 600 + (x - 600) * 0.65, FLOOR, x, H, "#707b971c");
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = p[2];
  for (const x of [70, 210, 940, 1050])
    ctx.fillRect(x, FLOOR + 10, 32, H - FLOOR);
  ctx.restore();
  const shade = ctx.createRadialGradient(600, 340, 180, 600, 330, 740);
  shade.addColorStop(0, "#00000000");
  shade.addColorStop(1, "#030611aa");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}
