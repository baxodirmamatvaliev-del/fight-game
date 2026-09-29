import { ease } from "./motion.js";

const rigs = new Map();
const lerp = (a, b, t) => a + (b - a) * t;
// Wind-up, contact and recovery use separate timings. Limbs stay opaque;
// they are articulated each frame rather than cross-fading whole pictures.
const strike = (time, wind, contact, end) =>
  time < wind
    ? -0.18 * ease(time / wind)
    : time < contact
      ? lerp(-0.18, 1, ease((time - wind) / (contact - wind)))
      : 1 - ease((time - contact) / (end - contact));

export function fightingPose(f, time) {
  const key = f.player ?? `preview-${f.x}`;
  let rig = rigs.get(key);
  if (!rig || rig.kind !== f.kind || time < rig.time || Math.abs(f.x - rig.x) > 150) {
    rig = { kind: f.kind, x: f.x, time, gait: 0, pose: null };
    rigs.set(key, rig);
  }
  const dt = Math.min(0.05, Math.max(0, time - rig.time));
  const walking = f.action === "walk" && f.y >= 534;
  if (walking) rig.gait += ((f.x - rig.x) * (f.facing || 1)) / 22;
  const stride = Math.sin(rig.gait),
    breathe = Math.sin(time * 3.2 + (Number.isFinite(f.player) ? f.player : 0));
  const p = {
    lean: breathe * 1.6,
    bob: breathe * 0.8,
    hand: [53 + breathe * 2, -202 + breathe * 2],
    elbow: [37, -179],
    rearHand: [15 - breathe, -218],
    rearElbow: [-28, -184],
    knee: [29, -62],
    foot: [46, 0],
    rearKnee: [-30, -61],
    rearFoot: [-42, 0],
    tilt: 0,
    fall: 0,
  };
  if (walking) {
    p.foot = [38 + stride * 31, -Math.max(0, Math.cos(rig.gait)) * 17];
    p.rearFoot = [-30 - stride * 31, -Math.max(0, -Math.cos(rig.gait)) * 17];
    p.knee = [23 + stride * 19, -64 - Math.max(0, Math.cos(rig.gait)) * 12];
    p.rearKnee = [-22 - stride * 19, -64 - Math.max(0, -Math.cos(rig.gait)) * 12];
    p.bob = -Math.abs(Math.cos(rig.gait)) * 3;
    p.lean = 3 + stride * 2;
    p.hand[0] -= stride * 4;
    p.rearHand[1] += stride * 3;
  }
  if (f.y < 534) {
    p.knee = [46, -88];
    p.foot = [40, -43];
    p.rearKnee = [-33, -85];
    p.rearFoot = [-24, -37];
    p.lean = -6;
  }
  const t = f.action_time || 0;
  if (f.action === "punch") {
    const drive = strike(t, 0.06, 0.12, 0.32);
    p.hand = [53 + drive * 75, -202 - drive * 5];
    p.elbow = [37 + drive * 45, -179 - drive * 26];
    p.lean = drive * 17;
    p.rearHand = [17, -223];
    p.tilt = drive * 0.035;
    if (f.attack_serial % 2 === 0) {
      [p.hand, p.rearHand] = [p.rearHand, p.hand];
      [p.elbow, p.rearElbow] = [p.rearElbow, p.elbow];
    }
  }
  if (f.action === "kick") {
    const drive = strike(t, 0.1, 0.21, 0.51);
    p.knee = [29 + drive * 56, -62 - drive * 73];
    p.foot = [46 + drive * 104, -drive * 150];
    p.hand = [31, -216];
    p.rearHand = [-14, -195];
    p.lean = -drive * 15;
    p.tilt = -drive * 0.06;
    p.rearKnee = [-22, -65];
  }
  if (["special", "xpower", "finisher"].includes(f.action)) {
    const ultimate = f.action !== "special";
    const impact = f.action === "finisher" ? 0.75 : ultimate ? 0.43 : 0.24;
    const end = f.action === "finisher" ? 1.6 : ultimate ? 1.25 : 0.62;
    const drive = strike(t, impact * 0.7, impact, end);
    p.hand = [39 + drive * 80, -194 - drive * (ultimate ? 33 : -21)];
    p.elbow = [30 + drive * 38, -177 - drive * 33];
    p.rearHand = [20 + drive * 42, -208 + drive * 20];
    p.lean = drive * 22;
    p.bob = Math.max(0, -drive) * 25;
    p.tilt = drive * 0.055;
    if (ultimate) {
      p.knee[0] += drive * 9;
      p.rearFoot[0] -= drive * 12;
    }
  }
  if (f.action === "block") {
    p.hand = [31, -244];
    p.elbow = [43, -210];
    p.rearHand = [15, -233];
    p.rearElbow = [-4, -204];
    p.lean = -8;
    p.bob = 5;
    p.knee[0] += 5;
  }
  if (f.action === "hurt") {
    p.lean = -22;
    p.tilt = -0.12;
    p.hand = [42, -176];
    p.rearHand = [-34, -189];
    p.knee = [30, -68];
  }
  if (f.action === "ko") {
    rig.koTime ??= time;
    p.fall = ease((time - rig.koTime) / 0.55);
  } else rig.koTime = null;
  const blend = rig.pose
    ? 1 - Math.exp(-dt * (f.action === "idle" || walking ? 24 : 65))
    : 1;
  const result = {};
  for (const [name, value] of Object.entries(p)) {
    const old = rig.pose?.[name] ?? value;
    result[name] = Array.isArray(value)
      ? value.map((n, i) => lerp(old[i], n, blend))
      : lerp(old, value, blend);
  }
  rig.pose = result;
  rig.x = f.x;
  rig.time = time;
  return result;
}
