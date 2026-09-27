import { drawSprite } from "./sprites.js";
export const fighters = {
  subzero: {
    name: "SUB-ZERO", title: "MUZ JANGCHISI", color: "#83daff", dark: "#153352", skin: "#b69b86",
    speed: 4, power: 3, moveSpeed: 300, damageScale: 1, element: "ice", special: "Muz zarbasi",
  },
  scorpion: {
    name: "SCORPION", title: "OLOV NINJASI", color: "#ffb443", dark: "#4c3218", skin: "#b78a63",
    speed: 3, power: 5, moveSpeed: 285, damageScale: 1.1, element: "fire", special: "Olov zarbasi",
  },
  volt: {
    name: "VOLT",
    title: "MUVOZANATLI JANGCHI",
    color: "#c9aa63",
    dark: "#353d32",
    skin: "#af8061",
    speed: 4,
    power: 3,
    moveSpeed: 305, damageScale: 1,
  },
  ember: {
    name: "EMBER",
    title: "KUCHLI ZARBALAR",
    color: "#c65942",
    dark: "#482d2a",
    skin: "#be8968",
    speed: 3,
    power: 5,
    moveSpeed: 275, damageScale: 1.12,
  },
  ghost: {
    name: "GHOST",
    title: "TEZKOR HARAKAT",
    color: "#87a9bb",
    dark: "#293943",
    skin: "#b59d8c",
    speed: 5,
    power: 2,
    moveSpeed: 330, damageScale: .9,
  },
};
function shape(ctx, points, fill, stroke = "#111519", width = 1.2) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
function shade(ctx, x, y, w, color, light) {
  const g = ctx.createLinearGradient(x - w, y, x + w, y);
  g.addColorStop(0, "#12151a");
  g.addColorStop(0.28, color);
  g.addColorStop(0.62, light);
  g.addColorStop(1, color);
  return g;
}
function stroke(ctx, points, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}
function segment(ctx, a, b, width, color, light) {
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
    length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  ctx.save();
  ctx.translate(...a);
  ctx.rotate(angle - Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(-width * 0.42, 0);
  ctx.bezierCurveTo(
    -width * 0.65,
    length * 0.25,
    -width * 0.45,
    length * 0.72,
    -width * 0.27,
    length,
  );
  ctx.quadraticCurveTo(0, length + 4, width * 0.27, length);
  ctx.bezierCurveTo(
    width * 0.43,
    length * 0.75,
    width * 0.58,
    length * 0.22,
    width * 0.42,
    0,
  );
  ctx.closePath();
  ctx.fillStyle = shade(ctx, 0, 0, width * 0.6, color, light);
  ctx.fill();
  ctx.strokeStyle = "#0b1016";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  stroke(
    ctx,
    [
      [-width * 0.25, 8],
      [-width * 0.3, length * 0.4],
      [-width * 0.15, length * 0.75],
    ],
    "#ffffff12",
    1,
  );
  ctx.restore();
}
function arm(ctx, shoulder, elbow, hand, def, back = false) {
  const skin = back ? "#705642" : def.skin;
  segment(
    ctx,
    shoulder,
    elbow,
    back ? 24 : 28,
    skin,
    back ? "#947257" : "#d8ac84",
  );
  segment(ctx, elbow, hand, back ? 18 : 21, skin, back ? "#947257" : "#cfa37e");
  const d = [hand[0] - elbow[0], hand[1] - elbow[1]],
    len = Math.hypot(...d) || 1;
  const wrist = [hand[0] - (d[0] / len) * 17, hand[1] - (d[1] / len) * 17];
  segment(ctx, wrist, hand, 21, "#292d30", "#4b5152");
  ctx.save();
  ctx.translate(...hand);
  ctx.rotate(Math.atan2(d[1], d[0]));
  ctx.fillStyle = shade(ctx, 0, 0, 14, "#8b654e", "#c79876");
  ctx.beginPath();
  ctx.roundRect(-3, -11, 20, 21, 5);
  ctx.fill();
  ctx.strokeStyle = "#241e1a";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let y = -6; y <= 6; y += 4)
    stroke(
      ctx,
      [
        [7, y],
        [15, y],
      ],
      "#584133",
      0.8,
    );
  ctx.restore();
}
function leg(ctx, hip, knee, foot, def, back = false) {
  const dark = back ? "#161d25" : def.dark;
  segment(ctx, hip, knee, 32, dark, back ? "#26303a" : "#58616a");
  segment(
    ctx,
    knee,
    [foot[0], foot[1] - 12],
    27,
    dark,
    back ? "#26303a" : "#49535e",
  );
  stroke(
    ctx,
    [
      [hip[0] + 9, hip[1] + 5],
      [knee[0] + 8, knee[1] - 4],
      [foot[0] + 7, foot[1] - 22],
    ],
    def.color + "65",
    2,
  );
  ctx.save();
  ctx.translate(...foot);
  ctx.fillStyle = shade(ctx, 0, -10, 18, "#141b23", "#3b4349");
  ctx.beginPath();
  ctx.moveTo(-13, -21);
  ctx.lineTo(9, -22);
  ctx.quadraticCurveTo(15, -7, 28, -5);
  ctx.quadraticCurveTo(36, 4, 25, 5);
  ctx.lineTo(-15, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#070c10";
  ctx.lineWidth = 2;
  ctx.stroke();
  stroke(
    ctx,
    [
      [-12, 2],
      [29, 2],
    ],
    "#7b7e78",
    2,
  );
  for (let y = -15; y < -4; y += 4)
    stroke(
      ctx,
      [
        [-6, y],
        [9, y],
      ],
      "#788085",
      0.8,
    );
  ctx.restore();
}
function head(ctx, def) {
  segment(ctx, [0, -220], [1, -238], 20, def.skin, "#c69e80");
  const ghost = def.name === "GHOST";
  ctx.fillStyle = shade(ctx, 2, -253, 18, def.skin, "#d6b195");
  ctx.beginPath();
  ctx.moveTo(-16, -262);
  ctx.bezierCurveTo(-17, -281, 10, -287, 20, -267);
  ctx.lineTo(19, -253);
  ctx.lineTo(24, -247);
  ctx.lineTo(19, -243);
  ctx.lineTo(17, -233);
  ctx.lineTo(7, -227);
  ctx.lineTo(-7, -232);
  ctx.lineTo(-14, -246);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1e1b1c";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = ghost ? "#8c9396" : "#262322";
  ctx.beginPath();
  ctx.moveTo(-17, -260);
  ctx.lineTo(-17, -276);
  ctx.quadraticCurveTo(3, -291, 17, -278);
  ctx.lineTo(21, -262);
  ctx.lineTo(14, -268);
  ctx.lineTo(8, -274);
  ctx.lineTo(-8, -270);
  ctx.lineTo(-10, -251);
  ctx.closePath();
  ctx.fill();
  stroke(
    ctx,
    [
      [5, -258],
      [16, -260],
    ],
    "#3b2e29",
    2,
  );
  stroke(
    ctx,
    [
      [8, -255],
      [17, -256],
    ],
    "#e9d9c3",
    1.2,
  );
  ctx.fillStyle = "#1d2429";
  ctx.fillRect(14, -256, 2, 2);
  stroke(
    ctx,
    [
      [12, -252],
      [13, -245],
      [19, -244],
    ],
    "#725442",
    1,
  );
  stroke(
    ctx,
    [
      [11, -237],
      [18, -238],
    ],
    "#634534",
    1.2,
  );
  ctx.fillStyle = "#997052";
  ctx.beginPath();
  ctx.ellipse(-12, -250, 4, 7, 0, 0, 7);
  ctx.fill();
  if (ghost) {
    shape(
      ctx,
      [
        [-10, -247],
        [19, -246],
        [17, -234],
        [6, -230],
        [-7, -235],
      ],
      "#242c33",
    );
    stroke(
      ctx,
      [
        [-5, -241],
        [16, -239],
      ],
      "#61727c",
      1,
    );
  }
  if (def.name === "EMBER") {
    stroke(
      ctx,
      [
        [-6, -238],
        [2, -230],
        [10, -231],
        [16, -236],
      ],
      "#4c352c",
      3,
    );
    stroke(
      ctx,
      [
        [3, -260],
        [4, -251],
      ],
      "#b55a49",
      1.2,
    );
  }
  if (def.name === "VOLT")
    stroke(
      ctx,
      [
        [3, -268],
        [18, -269],
      ],
      def.color,
      3,
    );
}
export function drawFighter(ctx, f, time, scale = 1, portrait = false) {
  if (drawSprite(ctx, f, time, scale, portrait)) return;
  const def = fighters[f.kind] || fighters.volt,
    action = f.action,
    grounded = f.y >= 534;
  const walking = action === "walk" && grounded,
    stride = walking ? Math.sin(time * 15) : 0,
    bob = grounded ? Math.sin(time * 3) * 1.6 : 0;
  let lean = 0,
    hand = [55, -193],
    elbow = [39, -174],
    rearHand = [22, -208],
    rearElbow = [-24, -183],
    knee = [28, -59],
    foot = [42, 0],
    rearKnee = [-28, -57],
    rearFoot = [-38, 0];
  if (walking) {
    foot = [35 + stride * 24, 0];
    rearFoot = [-33 - stride * 24, 0];
    knee = [19 + stride * 15, -62];
    rearKnee = [-21 - stride * 15, -60];
    hand = [54 - stride * 8, -194];
    lean = 4;
  }
  if (!grounded) {
    knee = [45, -85];
    foot = [32, -40];
    rearKnee = [-37, -88];
    rearFoot = [-25, -52];
    lean = -7;
  }
  if (action === "punch") {
    const p = Math.sin(Math.min(1, f.action_time / 0.32) * Math.PI);
    hand = [55 + p * 58, -199 - p * 9];
    elbow = [39 + p * 30, -174 - p * 28];
    lean = p * 13;
  }
  if (action === "kick") {
    const p = Math.sin(Math.min(1, f.action_time / 0.51) * Math.PI);
    knee = [28 + p * 50, -59 - p * 65];
    foot = [42 + p * 97, -p * 135];
    hand = [35, -211];
    lean = -p * 15;
  }
  if (action === "special") {
    hand = [71, -171];
    elbow = [36, -184];
    rearHand = [48, -185];
    lean = 8;
  }
  if (action === "block") {
    hand = [31, -241];
    elbow = [44, -204];
    rearHand = [17, -238];
    rearElbow = [-6, -206];
    lean = -9;
  }
  if (action === "hurt") {
    hand = [49, -166];
    rearHand = [-25, -182];
    lean = -18;
  }
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(scale, scale);
  if (!portrait) {
    ctx.fillStyle = "#0009";
    ctx.beginPath();
    ctx.ellipse(0, 535 - f.y, 63, 12, 0, 0, 7);
    ctx.fill();
  }
  ctx.scale(f.facing || 1, 1);
  ctx.translate(0, bob);
  if (action === "ko") {
    ctx.translate(-32, -16);
    ctx.rotate(-1.42);
  }
  leg(ctx, [-12, -113], rearKnee, rearFoot, def, true);
  ctx.save();
  ctx.translate(lean, -2);
  arm(ctx, [-24, -210], rearElbow, rearHand, def, true);
  const torso = shade(
    ctx,
    0,
    -175,
    35,
    def.dark,
    f.kind === "ember" ? "#74453a" : "#576267",
  );
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-23, -220);
  ctx.quadraticCurveTo(-40, -212, -31, -189);
  ctx.lineTo(-23, -153);
  ctx.lineTo(-22, -118);
  ctx.quadraticCurveTo(0, -111, 23, -119);
  ctx.lineTo(21, -157);
  ctx.lineTo(34, -195);
  ctx.quadraticCurveTo(37, -217, 16, -222);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#10171d";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (f.kind === "ember") {
    shape(
      ctx,
      [
        [-14, -219],
        [5, -200],
        [17, -222],
        [19, -168],
        [-3, -164],
        [-19, -172],
      ],
      shade(ctx, 0, -195, 18, def.skin, "#c99a76"),
    );
    stroke(
      ctx,
      [
        [-13, -188],
        [-2, -183],
        [10, -188],
      ],
      "#725140",
      1.5,
    );
    stroke(
      ctx,
      [
        [1, -177],
        [2, -167],
      ],
      "#76513c",
      1,
    );
  } else {
    stroke(
      ctx,
      [
        [-21, -206],
        [-2, -196],
        [17, -205],
      ],
      "#89928b55",
      2,
    );
    stroke(
      ctx,
      [
        [-19, -188],
        [-4, -181],
        [16, -188],
      ],
      "#0f171c",
      2,
    );
    stroke(
      ctx,
      [
        [-15, -164],
        [10, -164],
      ],
      "#6d777a",
      1,
    );
    stroke(
      ctx,
      [
        [-16, -151],
        [14, -150],
      ],
      "#10191e",
      2,
    );
  }
  shape(
    ctx,
    [
      [-25, -128],
      [22, -128],
      [24, -116],
      [-24, -114],
    ],
    "#151b21",
  );
  ctx.fillStyle = def.color;
  ctx.fillRect(-7, -127, 11, 10);
  ctx.fillStyle = "#34312b";
  ctx.fillRect(-4, -124, 5, 4);
  if (f.kind === "ghost") {
    shape(
      ctx,
      [
        [-24, -215],
        [-38, -190],
        [-32, -127],
        [-13, -141],
      ],
      "#222e36",
    );
    stroke(
      ctx,
      [
        [-32, -188],
        [-27, -140],
      ],
      "#78909b66",
      2,
    );
  }
  head(ctx, def);
  arm(ctx, [24, -211], elbow, hand, def);
  stroke(
    ctx,
    [
      [26, -206],
      [29, -197],
    ],
    def.color,
    2,
  );
  if (action === "special") {
    ctx.save();
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 25;
    ctx.fillStyle = def.color + "aa";
    ctx.beginPath();
    ctx.arc(88, -167, 13 + Math.sin(time * 30) * 3, 0, 7);
    ctx.fill();
    ctx.restore();
  }
  if (action === "block") {
    ctx.strokeStyle = def.color + "88";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(52, -200, 12, 48, 0, -1.2, 1.2);
    ctx.stroke();
  }
  ctx.restore();
  leg(ctx, [12, -113], knee, foot, def);
  ctx.restore();
}
export function drawPortrait(canvas, kind) {
  const ctx = canvas.getContext("2d");
  canvas.width = 220;
  canvas.height = 200;
  ctx.clearRect(0, 0, 220, 200);
  const def = fighters[kind],
    g = ctx.createLinearGradient(0, 0, 220, 200);
  g.addColorStop(0, def.color + "28");
  g.addColorStop(1, "#12171b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 220, 200);
  drawFighter(
    ctx,
    { kind, x: 105, y: 325, facing: 1, action: "idle", action_time: 0 },
    0,
    1.1,
    true,
  );
}
