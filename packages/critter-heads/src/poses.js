// Expression poses. Every character shares the same 12 expressions, but each species performs
// them its own way: a shared base pose per expression, then a per-character "acting" layer
// (ACTING[characterId][expression]) that changes arms, tail, ears and timing.
// Every value is a pure function of (t, beat start, seed): seeking always gives the same frame.

import { clamp, evalSeededBlink, evalSeededMicroMotion, evalAmplitude, sampleBucket } from "./math.js";
import { getRig, HEAD_ANCHORS } from "./rigdata.js";
import { solveArm } from "./limbs.js";

export const POSE_KEYS = [
  "bodyY", "bodyRot", "bodyScaleX", "bodyScaleY", "breath",
  "headX", "headY", "headRot",
  "earLRot", "earRRot", "earFlatten",
  "browLY", "browRY", "browLRot", "browRRot",
  "eyeScale", "pupilScale", "pupilX", "pupilY",
  "upperLid", "lowerLid", "lidSlant", "lidLExtra", "lidRExtra",
  "happyArc", "sleepArc", "heartEyes", "tear", "blush", "loveBlush",
  "mouthOpen", "mouthWidth", "mouthCurve", "mouthSkew", "mouthO", "tongueOut",
  "handLX", "handLY", "handRX", "handRY", "elbowLX", "elbowLY", "elbowRX", "elbowRY",
  "handLHead", "handRHead", "handLFront", "handRFront",
  "tailRot", "tailPuff", "bamboo",
  // species channels (005): bunny ear folds, sniffing noses, the frog's throat, tongue and fly
  "earLFlop", "earRFlop", "noseTwitch", "throat", "tongueFlick", "fly", "flyX", "flyY",
];

// ---------- idle quirks ----------
// A quirk happens at most once per window, at a seeded moment, and some windows skip it, so idle
// fidgets feel natural instead of looping on a beat. Returns the quirk's phase 0..1, or -1 when
// it isn't happening. Pure function of (t, seed).
function quirkPhase(s, seedUint, windowS, durS, channel, chance = 0.8) {
  const b = Math.floor(s / windowS);
  if (sampleBucket(seedUint, b, 40 + channel) > chance) return -1;
  const room = Math.max(0, windowS - durS);
  const start = b * windowS + sampleBucket(seedUint, b, 60 + channel) * room;
  const ph = (s - start) / durS;
  return ph >= 0 && ph <= 1 ? ph : -1;
}

// 0 -> 1 -> hold -> 0 over a quirk's phase (edge = fraction spent easing in and out)
function plateau(ph, edge = 0.22) {
  if (ph < 0 || ph > 1) return 0;
  const x = ph < edge ? ph / edge : ph > 1 - edge ? (1 - ph) / edge : 1;
  return x * x * (3 - 2 * x);
}

// ---------- arm helpers ----------

function anchor(rig, at) {
  return rig.anchors[at] || rig[at] || [120, 180];
}

function resolveTarget(rig, target) {
  if (Array.isArray(target)) return { x: target[0], y: target[1], head: 0 };
  const a = anchor(rig, target.at);
  return { x: a[0] + (target.dx || 0), y: a[1] + (target.dy || 0), head: HEAD_ANCHORS.has(target.at) ? 1 : 0 };
}

// Put a hand somewhere. target: [x, y] in body space, or { at: anchorName, dx, dy }.
// opts.front: draw the arm in front of the body; opts.top: draw it over the head (arms raised past
// the face); opts.elbow: where the elbow should point.
function setHand(p, rig, side, target, opts = {}) {
  const t = resolveTarget(rig, target);
  const sh = side === "L" ? rig.shoulderL : rig.shoulderR;
  const sign = side === "L" ? -1 : 1;
  p[`hand${side}X`] = t.x;
  p[`hand${side}Y`] = t.y;
  p[`hand${side}Head`] = t.head;
  p[`hand${side}Front`] = opts.top ? 2 : opts.front !== undefined ? (opts.front ? 1 : 0) : t.head;
  let hint;
  if (opts.elbow) {
    const e = resolveTarget(rig, opts.elbow);
    hint = [e.x, e.y];
  } else {
    hint = [(sh[0] + t.x) / 2 + sign * 22, (sh[1] + t.y) / 2 + 16];
  }
  p[`elbow${side}X`] = hint[0];
  p[`elbow${side}Y`] = hint[1];
}

function elbowOf(p, rig, side) {
  const sh = side === "L" ? rig.shoulderL : rig.shoulderR;
  return solveArm(sh, [p[`hand${side}X`], p[`hand${side}Y`]], rig.upper, rig.fore,
    [p[`elbow${side}X`], p[`elbow${side}Y`]]).elbow;
}

// Classic thinking pose: one paw on the chin, the other arm folded across the belly as a stand
// for the raised arm's elbow.
function thinkingArms(p, rig, side = "L", chinDx = -4, chinDy = 2) {
  const other = side === "L" ? "R" : "L";
  const sign = side === "L" ? -1 : 1;
  const belly = anchor(rig, "belly");
  setHand(p, rig, side, { at: "chin", dx: chinDx, dy: chinDy }, { front: true, elbow: [belly[0] + sign * 4, belly[1] - 10] });
  const e = elbowOf(p, rig, side);
  const osh = other === "L" ? rig.shoulderL : rig.shoulderR;
  setHand(p, rig, other, [e[0] - sign * 5, e[1] + 7], { front: true, elbow: [osh[0] - sign * 12, e[1] + 16] });
}

// ---------- base pose ----------

export function createBasePose(characterId) {
  const rig = getRig(characterId);
  const isRaccoon = characterId === "raccoon";
  const p = {};
  for (const k of POSE_KEYS) p[k] = 0;
  p.bodyScaleX = 1;
  p.bodyScaleY = 1;
  p.eyeScale = 1;
  p.pupilScale = 1;
  p.upperLid = isRaccoon ? 0.34 : 0;
  // always-on cheek blush (panda, bunny and frog designs)
  p.blush = { panda: 0.72, bunny: 0.8, frog: 0.75 }[characterId] || 0;
  p.flyX = 186;
  p.flyY = 92;
  p.mouthWidth = 1;
  p.mouthCurve = isRaccoon ? 0.28 : 0.5;
  setHand(p, rig, "L", { at: "restL" }, { front: false });
  setHand(p, rig, "R", { at: "restR" }, { front: false });
  return p;
}

// ---------- the 12 shared expressions ----------

function baseExpression(expression, p, c) {
  const { s, elapsed, blink, micro, characterId, rig } = c;
  const sh = { L: rig.shoulderL, R: rig.shoulderR };
  const chest = anchor(rig, "chest");
  const belly = anchor(rig, "belly");
  p.breath = Math.sin(s * 2.4) * 0.018;
  p.tailRot = Math.sin(s * 2.6) * 6;

  switch (expression) {
    case "happy": {
      const bounce = Math.abs(Math.sin(s * 6.5));
      p.bodyY = -bounce * 6.5;
      p.bodyScaleX = 1 + (0.5 - bounce) * 0.04;
      p.bodyScaleY = 1 + (bounce - 0.5) * 0.045;
      p.headY = -bounce * 2.5;
      p.headRot = Math.sin(s * 3.25) * 3.5;
      p.earLRot = -6 + Math.sin(s * 6.5) * 4;
      p.earRRot = 6 - Math.sin(s * 6.5) * 4;
      p.browLY = -4; p.browRY = -4; p.browLRot = -5; p.browRRot = 5;
      p.happyArc = 1;
      p.upperLid = 0;
      p.blush = Math.max(p.blush, 0.45);
      p.mouthOpen = 0.82 + Math.sin(s * 6.5) * 0.08;
      p.mouthWidth = 1.2;
      p.mouthCurve = 1;
      p.tailRot = Math.sin(s * 9.5) * 16;
      setHand(p, rig, "L", [sh.L[0] - 40, sh.L[1] - 40 - bounce * 6], { top: true, elbow: [sh.L[0] - 34, sh.L[1] - 6] });
      setHand(p, rig, "R", [sh.R[0] + 40, sh.R[1] - 40 - bounce * 6], { top: true, elbow: [sh.R[0] + 34, sh.R[1] - 6] });
      break;
    }
    case "thinking": {
      p.bodyY = Math.sin(s * 1.8) * 1.2;
      p.headRot = -4.5 + Math.sin(s * 1.5) * 1.5;
      p.headX = -1.5;
      p.earLRot = -4; p.earRRot = 8;
      p.browLY = 2.5; p.browRY = -5.5; p.browLRot = 10; p.browRRot = -8;
      p.pupilX = -0.42 + Math.sin(s * 1.2) * 0.08;
      p.pupilY = -0.3 + Math.cos(s * 1.5) * 0.05;
      p.upperLid = Math.max(characterId === "raccoon" ? 0.22 : 0, blink * 0.9);
      p.mouthWidth = 0.62; p.mouthCurve = -0.45; p.mouthSkew = 0.6;
      p.tailRot = Math.sin(s * 1.4) * 4;
      thinkingArms(p, rig, "L");
      break;
    }
    case "searching": {
      const scan = clamp((Math.sin(s * 2.8) + 0.35 * Math.sin(s * 5.6)) / 1.2, -1, 1);
      p.bodyRot = scan * 3.2;
      p.headX = scan * 4.5;
      p.headRot = scan * 6.5 + 3;
      p.earLRot = -16 + scan * 6; p.earRRot = 12 + scan * 4; p.earFlatten = 0.15;
      p.browLY = -2 + scan * 1.5; p.browRY = -4 - scan * 1.5; p.browLRot = 4; p.browRRot = -6;
      p.pupilX = clamp(0.48 + scan * 0.25, -0.75, 0.78);
      p.pupilY = -0.05 + Math.cos(s * 2.8) * 0.1;
      p.upperLid = Math.max(0.05, blink * 0.85);
      p.mouthWidth = 0.58; p.mouthCurve = -0.42; p.mouthSkew = -0.45;
      p.tailRot = Math.sin(s * 3.6) * 9;
      // paw as a visor over the eyes
      setHand(p, rig, "R", { at: "brow", dx: 30, dy: 4 }, { front: true, elbow: [sh.R[0] + 30, sh.R[1] + 4] });
      break;
    }
    case "listening": {
      p.bodyY = Math.sin(s * 2.0) * 1.0;
      p.headRot = 5.5 + Math.sin(s * 1.8) * 1.2;
      p.headY = Math.sin(s * 3.6) * 1.2;
      p.earLRot = -10 + micro.earTwitchL * 0.5;
      p.earRRot = 10 + micro.earTwitchR * 0.5;
      p.browLY = -3.5; p.browRY = -3.5;
      p.eyeScale = 1.08; p.pupilScale = 1.06;
      p.pupilX = 0.18 + micro.glanceX * 0.4; p.pupilY = -0.06;
      p.upperLid = blink * 0.92;
      p.mouthWidth = 0.95; p.mouthCurve = 0.55;
      p.tailRot = Math.sin(s * 2.0) * 4;
      // paw cupped beside the head
      setHand(p, rig, "R", { at: "cheekR", dx: 24, dy: -10 + Math.sin(s * 3.6) * 1.5 }, { front: true, elbow: [sh.R[0] + 26, sh.R[1] + 18] });
      break;
    }
    case "speaking": {
      const amp = c.amp;
      const nod = Math.sin(s * 5.2);
      p.bodyY = -Math.abs(nod) * 2.0;
      p.headY = nod * 2.2 - amp * 1.8;
      p.headRot = Math.sin(s * 2.6) * 3.2;
      p.earLRot = -4 - amp * 4; p.earRRot = 4 + amp * 4;
      p.browLY = -3 - amp * 2.5; p.browRY = -3 - amp * 2.5; p.browLRot = -4; p.browRRot = 4;
      p.pupilX = Math.sin(s * 1.9) * 0.12; p.pupilY = Math.cos(s * 2.3) * 0.08;
      p.upperLid = blink * 0.9;
      p.mouthOpen = clamp(0.18 + amp * 0.78, 0.12, 0.95);
      p.mouthWidth = 0.92 + amp * 0.22; p.mouthCurve = 0.75; p.mouthSkew = Math.sin(s * 4.1) * 0.18;
      p.tailRot = Math.sin(s * 4.5) * 9;
      // open-palm gesture that moves with the words
      setHand(p, rig, "R", [sh.R[0] + 20 + amp * 4, sh.R[1] + 20 - amp * 16 + Math.sin(s * 3.1) * 3], { front: true, elbow: [sh.R[0] + 16, sh.R[1] + 44] });
      setHand(p, rig, "L", [sh.L[0] - 10, sh.L[1] + 42 - amp * 6]);
      break;
    }
    case "working": {
      const bob = Math.sin(s * 8.5);
      p.bodyY = Math.abs(bob) * 1.8;
      p.bodyScaleX = 1 + bob * 0.012; p.bodyScaleY = 1 - bob * 0.012;
      p.headY = 2.5 + bob * 1.5;
      p.headRot = Math.sin(s * 4.2) * 2.0;
      p.earLRot = -3; p.earRRot = 3;
      p.browLY = 2.5; p.browRY = 2.5; p.browLRot = 12; p.browRRot = -12;
      p.pupilX = Math.sin(s * 6.0) * 0.18; p.pupilY = 0.36;
      p.upperLid = Math.max(0.32, blink * 0.9);
      p.lidSlant = 6;
      p.mouthWidth = 0.95; p.mouthCurve = 0.42; p.tongueOut = 1;
      p.tailRot = Math.sin(s * 5.0) * 5;
      // busy paws in front of the belly (typing / tinkering)
      setHand(p, rig, "L", [chest[0] - 15 + Math.sin(s * 11) * 3, belly[1] - 10 + Math.abs(Math.sin(s * 11)) * 5], { front: true });
      setHand(p, rig, "R", [chest[0] + 15 + Math.cos(s * 11) * 3, belly[1] - 10 + Math.abs(Math.cos(s * 11)) * 5], { front: true });
      break;
    }
    case "surprised": {
      const jumpT = clamp(elapsed / 550, 0, 1);
      const spring = Math.sin(jumpT * Math.PI * 2.5) * Math.exp(-jumpT * 3.8);
      p.bodyY = -spring * 14;
      p.bodyScaleX = 1 - spring * 0.07; p.bodyScaleY = 1 + spring * 0.09;
      p.headY = -3 - spring * 5;
      p.earLRot = -12; p.earRRot = 12;
      p.browLY = -6.5; p.browRY = -6.5; p.browLRot = -6; p.browRRot = 6;
      p.eyeScale = 1.18; p.pupilScale = 0.68;
      p.pupilX = Math.sin(s * 14) * 0.03;
      p.upperLid = 0;
      p.mouthO = 1; p.mouthOpen = 0.58; p.mouthWidth = 0.42; p.mouthCurve = 0;
      p.tailRot = 14 + spring * 18;
      p.tailPuff = 0.6;
      // paws fly up to the cheeks
      setHand(p, rig, "L", { at: "cheekL", dx: -8, dy: 12 - spring * 4 }, { front: true, elbow: [sh.L[0] - 22, sh.L[1] + 26] });
      setHand(p, rig, "R", { at: "cheekR", dx: 8, dy: 12 - spring * 4 }, { front: true, elbow: [sh.R[0] + 22, sh.R[1] + 26] });
      break;
    }
    case "upset": {
      const cyc = (s * 2.2) % 1;
      const stomp = cyc < 0.25 ? Math.sin((cyc / 0.25) * Math.PI) : 0;
      p.bodyY = stomp * 3.5;
      p.bodyScaleX = 1 + stomp * 0.035 + Math.sin(s * 4.4) * 0.015; p.bodyScaleY = 1 - stomp * 0.035;
      p.headY = 2 + stomp * 2;
      p.headRot = Math.sin(s * 9.0) * 1.2;
      p.earLRot = 28; p.earRRot = -28; p.earFlatten = 0.85;
      p.browLY = 4.5; p.browRY = 4.5; p.browLRot = 20; p.browRRot = -20;
      p.upperLid = Math.max(0.42, blink * 0.9);
      p.lidSlant = 14; p.pupilScale = 0.92;
      p.mouthWidth = 0.88; p.mouthCurve = -0.88;
      p.tailRot = -10 + Math.sin(s * 7.5) * 10;
      // arms crossed
      setHand(p, rig, "R", [chest[0] - 20, chest[1] + 9], { front: true, elbow: [sh.R[0] + 8, chest[1] + 24] });
      setHand(p, rig, "L", [chest[0] + 20, chest[1] + 13], { front: true, elbow: [sh.L[0] - 8, chest[1] + 26] });
      break;
    }
    case "sad": {
      p.bodyY = 4.5 + Math.sin(s * 1.4) * 1.2;
      p.bodyScaleX = 1.02; p.bodyScaleY = 0.97;
      p.headY = 4.5;
      p.headRot = -3.0 + Math.sin(s * 1.2) * 1.2;
      p.earLRot = 34; p.earRRot = -34; p.earFlatten = 1.0;
      p.browLY = -1.5; p.browRY = -1.5; p.browLRot = -16; p.browRRot = 16;
      p.pupilY = 0.16;
      p.upperLid = Math.max(0.38, blink * 0.95);
      p.lidSlant = -14; p.tear = 1;
      p.mouthWidth = 0.78; p.mouthCurve = -0.82;
      p.tailRot = -18 + Math.sin(s * 1.3) * 3;
      // paws held together low in front
      setHand(p, rig, "L", [belly[0] - 3, belly[1] + 14], { front: true });
      setHand(p, rig, "R", [belly[0] + 4, belly[1] + 15], { front: true });
      break;
    }
    case "sleeping": {
      const slow = Math.sin(s * 1.35);
      p.breath = slow * 0.032;
      p.bodyY = 2.5 - slow * 1.8;
      p.bodyRot = Math.sin(s * 0.9) * 1.8;
      p.headY = 3.5 - slow * 1.5;
      p.headRot = 7.5 + Math.sin(s * 0.9) * 2.0;
      p.earLRot = 22; p.earRRot = -22; p.earFlatten = 0.68;
      p.browLY = 1.5; p.browRY = 1.5; p.browLRot = -4; p.browRRot = 4;
      p.sleepArc = 1; p.upperLid = 0;
      p.mouthWidth = 0.78; p.mouthCurve = 0.45;
      p.tailRot = -12 + slow * 3;
      // paws tucked under the cheek like a pillow
      setHand(p, rig, "R", { at: "cheekR", dx: 12, dy: 14 }, { front: true, elbow: [sh.R[0] + 18, sh.R[1] + 30] });
      setHand(p, rig, "L", { at: "cheekR", dx: 2, dy: 22 }, { front: true, elbow: [chest[0] - 4, chest[1] + 18] });
      break;
    }
    case "love": {
      const sway = Math.sin(s * 2.8);
      const bob = Math.cos(s * 5.6);
      p.bodyY = -Math.abs(bob) * 2.5;
      p.bodyRot = sway * 3.0;
      p.headRot = sway * 5.5;
      p.headY = -Math.abs(bob) * 1.8;
      p.earLRot = -6 + sway * 4; p.earRRot = 6 + sway * 4;
      p.browLY = -3; p.browRY = -3; p.browLRot = -5; p.browRRot = 5;
      p.eyeScale = 1.06; p.heartEyes = 1; p.upperLid = 0;
      p.blush = 1; p.loveBlush = 1;
      p.mouthOpen = characterId === "owl" ? 0.65 : 0;
      p.mouthWidth = 1.05; p.mouthCurve = 0.88;
      p.tailRot = Math.sin(s * 5.6) * 12;
      // paws clasped at the chest
      setHand(p, rig, "L", [chest[0] - 2, chest[1] + 2], { front: true });
      setHand(p, rig, "R", [chest[0] + 4, chest[1] + 4], { front: true });
      break;
    }
    case "idle":
    default: {
      p.bodyY = -Math.sin(s * 2.4) * 1.5;
      p.headY = -Math.sin(s * 2.4 - 0.3) * 1.2;
      p.headRot = Math.sin(s * 1.3) * 1.4;
      p.earLRot = micro.earTwitchL; p.earRRot = micro.earTwitchR;
      p.pupilX = micro.glanceX; p.pupilY = micro.glanceY;
      const baseLid = characterId === "raccoon" ? 0.34 : 0;
      p.upperLid = clamp(baseLid + blink * (1 - baseLid), 0, 1);
      setHand(p, rig, "L", { at: "restL", dy: Math.sin(s * 2.4) * 1.2 });
      setHand(p, rig, "R", { at: "restR", dy: Math.sin(s * 2.4 + 0.4) * 1.2 });
      break;
    }
  }
}

// ---------- per-species acting ----------
// c: { s, elapsed, rig, amp, blink, micro, hand(side, target, opts), sh, anchor(name) }

const ACTING = {
  fox: {
    // cocky: one paw on the hip, big lazy tail swish
    idle(p, c) {
      c.hand("R", { at: "hipR", dx: 10, dy: -2 }, { front: true, elbow: [c.sh.R[0] + 26, c.sh.R[1] + 22] });
      p.tailRot = Math.sin(c.s * 1.6) * 12;
      p.browRY -= 1.5; // a little smug
    },
    // fist pump + huge tail wag
    happy(p, c) {
      const pump = Math.abs(Math.sin(c.s * 6.5));
      c.hand("R", [c.sh.R[0] + 48, c.sh.R[1] - 48 - pump * 6], { top: true, elbow: [c.sh.R[0] + 46, c.sh.R[1] - 4] });
      c.hand("L", { at: "hipL", dx: -10, dy: -2 }, { front: true, elbow: [c.sh.L[0] - 26, c.sh.L[1] + 22] });
      p.tailRot = Math.sin(c.s * 11) * 24;
    },
    // smug one-brow raise while thinking, tail curling slowly
    thinking(p, c) {
      p.browRY = -8; p.browRRot = -12; p.browLY = 3;
      p.tailRot = 8 + Math.sin(c.s * 0.9) * 10;
      p.mouthSkew = 0.85;
    },
    // nose to the air: quick sniffing bobs
    searching(p, c) {
      p.headY += Math.sin(c.s * 18) * 0.9;
      p.tailRot = -6 + Math.sin(c.s * 2) * 4;
    },
    surprised(p) { p.tailPuff = 1; p.earLRot = -18; p.earRRot = 18; },
    sad(p, c) { p.tailRot = -28 + Math.sin(c.s * 1.1) * 2; },
    upset(p, c) { p.tailRot = -14 + Math.sin(c.s * 10) * 14; },
    love(p, c) { p.tailRot = Math.sin(c.s * 8) * 20; },
  },

  owl: {
    // skeptical: one eye half-lidded, the occasional slow owl head-tilt
    idle(p, c) {
      p.browLY = 1.2; p.browRY = -2.2 + Math.sin(c.s * 1.6) * 0.8; p.browLRot = 4; p.browRRot = -4;
      const cyc = (c.s % 6) / 6;
      p.headRot += cyc > 0.7 ? Math.sin(((cyc - 0.7) / 0.3) * Math.PI) * 16 : 0;
    },
    // wing flaps + hop
    happy(p, c) {
      const flap = Math.sin(c.s * 13);
      c.hand("L", [c.sh.L[0] - 40, c.sh.L[1] - 10 + flap * 22]);
      c.hand("R", [c.sh.R[0] + 40, c.sh.R[1] - 10 + flap * 22]);
    },
    // wing tip tucked under the beak, the other wing propping up the elbow, eyes up: mulling it over
    thinking(p, c) {
      thinkingArms(p, c.rig, "L", -12, 8);
      p.headRot = -7 + Math.sin(c.s * 1.2) * 2;
      p.browRY = -7; p.browRRot = -10;
    },
    // the full owl head swivel
    searching(p, c) {
      const swivel = Math.sin(c.s * 1.9);
      p.headRot = swivel * 26; p.headX = swivel * 3; p.bodyRot = swivel * 1.5;
      p.eyeScale = 1.12; p.pupilX = swivel * 0.55;
      c.hand("R", { at: "restR" }, { front: false });
    },
    listening(p, c) { p.headRot = 16 + Math.sin(c.s * 1.5) * 2; p.earLRot = -14; p.earRRot = 14; },
    // feathers puff up, wings flare wide open
    surprised(p, c) {
      p.bodyScaleX *= 1.1; p.bodyScaleY *= 1.05; p.eyeScale = 1.24;
      c.hand("L", [c.sh.L[0] - 54, c.sh.L[1] - 4], { front: false });
      c.hand("R", [c.sh.R[0] + 54, c.sh.R[1] - 4], { front: false });
    },
    // wings on hips, tufts angled down
    upset(p, c) {
      c.hand("L", { at: "hipL", dx: -6 }, { front: true, elbow: [c.sh.L[0] - 26, c.sh.L[1] + 16] });
      c.hand("R", { at: "hipR", dx: 6 }, { front: true, elbow: [c.sh.R[0] + 26, c.sh.R[1] + 16] });
      p.bodyY = Math.abs(Math.sin(c.s * 3)) * 1.5;
    },
    // reading: pushes the glasses up every few seconds (eyes stay open behind the lenses)
    working(p, c) {
      p.upperLid = Math.max(0.12, c.blink * 0.9);
      p.pupilY = 0.25;
      const cyc = (c.s % 3.2) / 3.2;
      if (cyc > 0.72) {
        const k = Math.sin(((cyc - 0.72) / 0.28) * Math.PI);
        c.hand("R", { at: "glasses", dx: 4 + (1 - k) * 30, dy: (1 - k) * 60 }, { front: true, elbow: [c.sh.R[0] + 8, c.sh.R[1] + 34] });
      }
    },
    // lecturing: one wing raised like a pointing finger
    speaking(p, c) {
      c.hand("R", [c.sh.R[0] + 16, c.sh.R[1] - 34 + Math.sin(c.s * 5) * 4], { front: false });
    },
    sleeping(p) { p.headY += 4; p.headRot = 4; },
  },

  cat: {
    // tail held high; every few seconds a quick paw-lick
    idle(p, c) {
      p.tailRot = 6 + Math.sin(c.s * 1.8) * 8;
      const cyc = (c.s % 4.5) / 4.5;
      if (cyc > 0.66) {
        const k = Math.sin(((cyc - 0.66) / 0.34) * Math.PI);
        c.hand("L", { at: "mouth", dx: -6 - (1 - k) * 30, dy: 12 + (1 - k) * 60 }, { front: k > 0.3, elbow: [c.anchor("belly")[0] - 8, c.anchor("belly")[1] - 6] });
        p.tongueOut = k > 0.5 ? 1 : 0;
        p.lidLExtra = k * 0.5; p.lidRExtra = k * 0.5;
      }
    },
    // kneading paws + slow happy blink, tail quivering upright
    happy(p, c) {
      const kn = Math.sin(c.s * 7);
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 12, chest[1] + 8 + kn * 6], { front: true });
      c.hand("R", [chest[0] + 12, chest[1] + 8 - kn * 6], { front: true });
      p.tailRot = 4 + Math.sin(c.s * 22) * 3;
      p.bodyY *= 0.4;
    },
    thinking(p, c) { p.tailRot = Math.sin(c.s * 5) * 3 + (Math.sin(c.s * 0.8) > 0.6 ? 10 : 0); },
    // hunting crouch with a butt-wiggle, pupils wide, paws ready
    searching(p, c) {
      p.bodyY = 7; p.bodyScaleY = 0.93; p.bodyScaleX = 1.04;
      p.bodyRot = Math.sin(c.s * 14) * 1.6;
      p.pupilScale = 1.35;
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 18, belly[1] + 4], { front: true });
      c.hand("R", [belly[0] + 18, belly[1] + 2], { front: true });
      p.tailRot = Math.sin(c.s * 9) * 14;
    },
    // arched back, puffed tail, paws up with claws out
    surprised(p, c) {
      p.bodyScaleY *= 1.07; p.tailPuff = 1.4; p.earLRot = -16; p.earRRot = 16;
      c.hand("L", [c.sh.L[0] - 36, c.sh.L[1] - 38], { top: true, elbow: [c.sh.L[0] - 30, c.sh.L[1] - 4] });
      c.hand("R", [c.sh.R[0] + 36, c.sh.R[1] - 38], { top: true, elbow: [c.sh.R[0] + 30, c.sh.R[1] - 4] });
    },
    // hiss + a paw swipe
    upset(p, c) {
      p.mouthOpen = 0.55; p.mouthCurve = -0.6; p.mouthWidth = 1.1;
      const swipe = Math.max(0, Math.sin(c.s * 4.2));
      c.hand("R", [c.sh.R[0] + 26 + swipe * 8, c.sh.R[1] - 10 - swipe * 22], { front: true });
      c.hand("L", { at: "restL" }, { front: false });
      p.tailRot = Math.sin(c.s * 12) * 18;
    },
    // loaf: paws tucked under, tail wrapped
    sleeping(p, c) {
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 8, belly[1] + 10], { front: true });
      c.hand("R", [belly[0] + 8, belly[1] + 10], { front: true });
      p.tailRot = 22;
    },
    love(p, c) { p.happyArc = 0.6 + Math.sin(c.s * 1.5) * 0.4; p.headRot = 12 + Math.sin(c.s * 2) * 4; },
  },

  raccoon: {
    // always rubbing those little hands together
    idle(p, c) {
      const rub = Math.sin(c.s * 5);
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 5 + rub * 4, chest[1] + 12 + rub * 1.5], { front: true });
      c.hand("R", [chest[0] + 5 + rub * 4, chest[1] + 12 - rub * 1.5], { front: true });
    },
    // faster rubbing, deadpan smirk instead of a big grin
    happy(p, c) {
      const rub = Math.sin(c.s * 12);
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 5 + rub * 5, chest[1] + 6], { front: true });
      c.hand("R", [chest[0] + 5 + rub * 5, chest[1] + 6], { front: true });
      p.mouthOpen = 0.2; p.mouthWidth = 0.9; p.happyArc = 0.75;
    },
    // steepled fingers under the chin
    thinking(p, c) {
      c.hand("L", { at: "chin", dx: -5, dy: 8 }, { front: true, elbow: [c.sh.L[0] - 10, c.sh.L[1] + 34] });
      c.hand("R", { at: "chin", dx: 5, dy: 8 }, { front: true, elbow: [c.sh.R[0] + 10, c.sh.R[1] + 34] });
      p.mouthSkew = 0.3; p.mouthCurve = 0.2;
    },
    // peeking: hands held up at the chest, low and sneaky
    searching(p, c) {
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 10, chest[1] - 2], { front: true });
      c.hand("R", [chest[0] + 10, chest[1] - 2], { front: true });
      p.bodyY = 4; p.tailRot = 14 + Math.sin(c.s * 4) * 6;
    },
    // fidgety hands, like washing something
    working(p, c) {
      const w = Math.sin(c.s * 14);
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 6 + w * 6, belly[1] - 8 + Math.cos(c.s * 14) * 3], { front: true });
      c.hand("R", [belly[0] + 6 - w * 6, belly[1] - 8 - Math.cos(c.s * 14) * 3], { front: true });
    },
    surprised(p) { p.mouthO = 1; p.mouthOpen = 0.8; },
    // deadpan: arms crossed, no stomping, just a tail flick
    upset(p, c) { p.bodyY = 0; p.bodyScaleX = 1; p.bodyScaleY = 1; p.tailRot = Math.sin(c.s * 6) * 8; p.lidSlant = 6; },
    // wide yawn every few seconds
    sleeping(p, c) {
      const cyc = (c.s % 7) / 7;
      if (cyc > 0.78) {
        const k = Math.sin(((cyc - 0.78) / 0.22) * Math.PI);
        p.mouthO = k; p.mouthOpen = k * 0.9;
      }
    },
    love(p, c) {
      c.hand("L", { at: "chin", dx: -6, dy: 12 }, { front: true });
      c.hand("R", { at: "chin", dx: 6, dy: 12 }, { front: true });
    },
  },

  panda: {
    // munching bamboo, unbothered
    idle(p, c) {
      p.bamboo = 1;
      c.hand("L", { at: "mouth", dx: -16, dy: 18 }, { front: true, elbow: [c.sh.L[0] - 6, c.sh.L[1] + 36] });
      c.hand("R", { at: "mouth", dx: 14, dy: 26 }, { front: true, elbow: [c.sh.R[0] + 6, c.sh.R[1] + 38] });
      const chew = Math.max(0, Math.sin(c.s * 7));
      p.mouthOpen = chew > 0.2 ? 0.16 + chew * 0.22 : 0;
      p.mouthWidth = 0.7;
      p.upperLid = Math.max(p.upperLid, 0.18);
    },
    // claps + belly bounce
    happy(p, c) {
      const clap = Math.abs(Math.sin(c.s * 6.5));
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 4 - clap * 18, chest[1] - 6], { front: true });
      c.hand("R", [chest[0] + 4 + clap * 18, chest[1] - 6], { front: true });
      p.bodyScaleX = 1 + clap * 0.03;
    },
    // scratches the top of its head
    thinking(p, c) {
      c.hand("R", { at: "headTop", dx: 34, dy: 4 + Math.sin(c.s * 9) * 2 }, { top: true, elbow: [c.sh.R[0] + 64, c.sh.R[1] - 30] });
      c.hand("L", [c.anchor("belly")[0] - 6, c.anchor("belly")[1] - 4], { front: true });
      p.headRot = 6;
    },
    working(p, c) { p.bamboo = 0; },
    // drops everything: arms up wide, plops back
    surprised(p, c) {
      c.hand("L", [c.sh.L[0] - 42, c.sh.L[1] - 36], { top: true, elbow: [c.sh.L[0] - 34, c.sh.L[1] - 4] });
      c.hand("R", [c.sh.R[0] + 42, c.sh.R[1] - 36], { top: true, elbow: [c.sh.R[0] + 34, c.sh.R[1] - 4] });
      p.bodyY += 3;
    },
    // grumpy pout, puffed cheeks, slow sway instead of stomping
    upset(p, c) { p.blush = 1; p.bodyY = 0; p.bodyRot = Math.sin(c.s * 1.6) * 3; p.mouthWidth = 0.6; },
    // paws on the belly, big slow breaths
    sleeping(p, c) {
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 12, belly[1] - 4], { front: true });
      c.hand("R", [belly[0] + 12, belly[1] - 4], { front: true });
      p.breath *= 1.6; p.headRot = 4;
    },
    // self-hug
    love(p, c) {
      c.hand("L", { at: "shoulderR", dx: -8, dy: 12 }, { front: true });
      c.hand("R", { at: "shoulderL", dx: 8, dy: 16 }, { front: true });
    },
  },

  dog: {
    // eager: tail always going, bouncing on its toes, panting in happy bursts; now and then the
    // classic dog head-tilt ("huh?") with one ear cocked
    idle(p, c) {
      p.bodyY -= Math.abs(Math.sin(c.s * 3.2)) * 1.4;
      p.tailRot = Math.sin(c.s * 9) * 18;
      const pant = c.quirk(5, 3.2, 1, 0.7);
      if (pant >= 0) {
        const env = Math.min(1, Math.sin(pant * Math.PI) * 2.2);
        p.mouthOpen = env * (0.3 + Math.abs(Math.sin(c.s * 9)) * 0.14);
        p.mouthWidth = 1.05; p.mouthCurve = 0.8;
        p.breath += Math.sin(c.s * 18) * 0.012 * env;
      }
      const tilt = plateau(c.quirk(4.2, 1.6, 2, 0.6));
      p.headRot += 15 * tilt;
      p.earLRot -= 12 * tilt; p.earRRot += 4 * tilt;
      p.browLY -= 3 * tilt; p.pupilY -= 0.2 * tilt;
    },
    // happy dance: paws up, bouncing, tongue out, tail a blur
    happy(p, c) {
      p.tailRot = Math.sin(c.s * 16) * 28;
      p.tongueOut = 1;
    },
    // head cocked all the way over, one ear up, paw on the chin
    thinking(p, c) {
      p.headRot = 12 + Math.sin(c.s * 1.5) * 2;
      p.earLRot = -10; p.earRRot = 4;
      p.tailRot = Math.sin(c.s * 2.5) * 8;
    },
    // nose down on a scent: quick sniffs, eyes on the ground, tail in overdrive
    searching(p, c) {
      p.headY = 5 + Math.sin(c.s * 14) * 1.2;
      p.headRot = Math.sin(c.s * 1.6) * 8;
      p.noseTwitch = Math.sin(c.s * 22);
      p.pupilY = 0.45;
      p.tailRot = 10 + Math.sin(c.s * 12) * 10;
      c.hand("L", { at: "restL" }, { front: false });
      c.hand("R", { at: "restR" }, { front: false });
    },
    // ears pricked straight up, head tilted, hanging on every word
    listening(p, c) {
      p.headRot = -10 + Math.sin(c.s * 1.8) * 2;
      p.earLRot = 6; p.earRRot = -6;
      p.tailRot = Math.sin(c.s * 8) * 12;
    },
    // barks out ideas: a big wave that keeps time with the words
    speaking(p, c) {
      c.hand("R", [c.sh.R[0] + 26, c.sh.R[1] - 20 + Math.sin(c.s * 6) * 8], { front: true });
      p.tailRot = Math.sin(c.s * 6) * 10;
    },
    // airplane ears, tongue poking out the side, digging at the work like a buried bone
    working(p, c) {
      p.earLRot = 0; p.earRRot = 0; p.earFlatten = 1;
      const dig = Math.sin(c.s * 16);
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 9, belly[1] - 6 + dig * 7], { front: true });
      c.hand("R", [belly[0] + 9, belly[1] - 6 - dig * 7], { front: true });
      p.tailRot = Math.sin(c.s * 12) * 12;
    },
    surprised(p) { p.earLRot = -4; p.earRRot = 4; p.tailRot = 30; },
    // ears pinned flat, low grumble, tail stiff
    upset(p) { p.earLRot = 0; p.earRRot = 0; p.earFlatten = 1; p.tailRot = -16; },
    // puppy-dog eyes, ears flat out, tail tucked
    sad(p, c) { p.earLRot = 0; p.earRRot = 0; p.earFlatten = 1; p.tailRot = -26 + Math.sin(c.s * 1.1) * 2; },
    // a shiba donut: ears down, little dream-twitches of the paws
    sleeping(p, c) {
      p.earLRot = 0; p.earRRot = 0; p.earFlatten = 0.9;
      const twitch = c.quirk(3, 0.5, 3, 0.6);
      const belly = c.anchor("belly");
      const k = twitch >= 0 ? Math.sin(twitch * Math.PI * 4) * 3 : 0;
      c.hand("L", [belly[0] - 10, belly[1] + 6 + k], { front: true });
      c.hand("R", [belly[0] + 10, belly[1] + 6 - k], { front: true });
      p.tailRot = 8 + Math.sin(c.s * 1.2) * 3;
    },
    love(p, c) { p.tailRot = Math.sin(c.s * 14) * 26; p.earLRot = -4; p.earRRot = 4; },
  },

  bunny: {
    // can't sit still: nose twitching, ears swivelling on their own, paws tucked up at the chest,
    // eyes darting; every few seconds one ear flops over and springs back, or a little binky hop
    idle(p, c) {
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 9, chest[1] + 2], { front: true });
      c.hand("R", [chest[0] + 9, chest[1] + 2], { front: true });
      p.noseTwitch = Math.sin(c.s * 26) * (Math.sin(c.s * 2.1) > 0.1 ? 1 : 0);
      p.earLRot = Math.sin(c.s * 2.3) * 6 + c.micro.earTwitchL;
      p.earRRot = Math.sin(c.s * 1.7 + 1) * 6 + c.micro.earTwitchR;
      p.pupilX = Math.round(Math.sin(c.s * 1.3) * 2) * 0.22;
      p.earLFlop = plateau(c.quirk(4.6, 1.4, 1, 0.5), 0.3);
      p.earRFlop = plateau(c.quirk(3.7, 1.2, 4, 0.5), 0.3);
      const hop = c.quirk(2.9, 0.42, 2, 0.5);
      if (hop >= 0) {
        const k = Math.sin(hop * Math.PI);
        p.bodyY -= k * 8;
        p.bodyScaleY *= 1 + k * 0.04; p.bodyScaleX *= 1 - k * 0.03;
        p.earLRot -= k * 8; p.earRRot += k * 8;
      }
    },
    // binkies: high hops, ears thrown back, paws up at the chest
    happy(p, c) {
      const hop = Math.abs(Math.sin(c.s * 7.5));
      p.bodyY = -hop * 9;
      p.earLRot = -10 - hop * 10; p.earRRot = 10 + hop * 10;
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 12, chest[1] - 4 - hop * 6], { front: true });
      c.hand("R", [chest[0] + 12, chest[1] - 4 - hop * 6], { front: true });
    },
    // one ear upright, the other folded over, paw tapping the chin
    thinking(p, c) {
      p.earLRot = -4; p.earRRot = 8;
      p.earRFlop = 1;
      p.noseTwitch = Math.sin(c.s * 20) * 0.5;
    },
    // one ear out sideways like a radar dish, swivelling
    searching(p, c) {
      p.earLRot = -70 + Math.sin(c.s * 2.8) * 12; p.earRRot = 6 + Math.sin(c.s * 3.4) * 6;
      p.earFlatten = 0;
      p.noseTwitch = Math.sin(c.s * 24);
    },
    // both ears leaning in, one tip folded toward the voice
    listening(p, c) {
      p.earLRot = -2; p.earRRot = 10;
      p.earRFlop = 0.85;
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 9, chest[1] + 4], { front: true });
    },
    // talks at 2x speed, both paws going
    speaking(p, c) {
      c.hand("L", [c.sh.L[0] - 18, c.sh.L[1] - 12 + Math.sin(c.s * 8) * 6], { front: true });
      c.hand("R", [c.sh.R[0] + 18, c.sh.R[1] - 12 - Math.sin(c.s * 8) * 6], { front: true });
      p.earLRot = Math.sin(c.s * 6) * 8; p.earRRot = -Math.sin(c.s * 6) * 8;
    },
    // one ear flung sideways, tongue out, paws a blur
    working(p, c) {
      p.earLRot = -78; p.earRRot = 22; p.earFlatten = 0;
      const w = Math.sin(c.s * 18);
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 9, belly[1] - 8 + w * 6], { front: true });
      c.hand("R", [belly[0] + 9, belly[1] - 8 - w * 6], { front: true });
    },
    // straight up, ears stiff as lightning rods
    surprised(p) { p.earLRot = 2; p.earRRot = -2; p.earFlatten = 0; p.bodyY -= 4; },
    // ears straight out sideways, foot thump
    upset(p, c) {
      p.earLRot = -84; p.earRRot = 84; p.earFlatten = 0;
      const cyc = (c.s * 1.6) % 1;
      p.bodyY = cyc < 0.12 ? Math.sin((cyc / 0.12) * Math.PI) * 4 : 0;
    },
    // long ears hanging down past the cheeks
    sad(p) { p.earLRot = -150; p.earRRot = 150; p.earFlatten = 0; p.headY += 1; },
    sleeping(p) { p.earLRot = -142; p.earRRot = 142; p.earFlatten = 0; },
    // one ear folded into a heart curve, paws clasped under the chin
    love(p) { p.earLRot = -8; p.earRRot = 6; p.earLFlop = 0.8; },
  },

  bear: {
    // gentle giant: slow heavy breaths, a lazy sway, paws resting on the belly; now and then a
    // contented pat-pat on the tummy, or a long sniff of something nice in the air
    idle(p, c) {
      p.breath = Math.sin(c.s * 1.5) * 0.026;
      p.bodyRot = Math.sin(c.s * 0.8) * 1.6;
      p.headRot += Math.sin(c.s * 0.8 + 0.4) * 1.5;
      const pat = c.quirk(6, 1.3, 1, 0.75);
      const tap = pat >= 0 ? Math.abs(Math.sin(pat * Math.PI * 2)) * 6 : 0;
      c.hand("L", { at: "chest", dx: -18, dy: 6 - tap }, { front: true });
      c.hand("R", { at: "chest", dx: 18, dy: 6 - tap }, { front: true });
      if (pat >= 0) p.happyArc = Math.max(p.happyArc, plateau(pat) * 0.9);
      const sniff = plateau(c.quirk(9, 2, 2, 0.6));
      p.headY -= sniff * 3; p.headRot -= sniff * 4;
      p.noseTwitch = sniff * Math.sin(c.s * 16);
      p.sleepArc = Math.max(p.sleepArc, sniff);
    },
    // a deep belly laugh, the whole bear shaking
    happy(p, c) {
      const laugh = Math.sin(c.s * 9);
      p.bodyY = Math.abs(laugh) * -2;
      p.bodyScaleY = 1 + laugh * 0.03; p.bodyScaleX = 1 - laugh * 0.02;
      c.hand("L", { at: "belly", dx: -14, dy: 2 + laugh * 3 }, { front: true });
      c.hand("R", { at: "belly", dx: 14, dy: 2 - laugh * 3 }, { front: true });
    },
    // slow chin rub, eyes up
    thinking(p, c) { p.headRot = -5 + Math.sin(c.s * 0.9) * 2; },
    // paw shading the brow, slowly panning the horizon
    searching(p, c) { p.headRot = Math.sin(c.s * 1.1) * 8; p.bodyRot = Math.sin(c.s * 1.1) * 2; },
    // a slow, thoughtful nod
    listening(p, c) { p.headRot = 7; p.headY = Math.max(0, Math.sin(c.s * 2.2)) * 3; },
    // slow, reassuring gestures with both broad paws
    speaking(p, c) {
      c.hand("L", [c.sh.L[0] - 22, c.sh.L[1] + 18 - Math.sin(c.s * 3) * 5], { front: true });
      c.hand("R", [c.sh.R[0] + 22, c.sh.R[1] + 18 + Math.sin(c.s * 3) * 5], { front: true });
    },
    // patient craftsmanship: tongue out, slow careful paw work
    working(p, c) {
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 12, chest[1] + 14 + Math.sin(c.s * 4) * 3], { front: true });
      c.hand("R", [chest[0] + 12, chest[1] + 14 - Math.sin(c.s * 4) * 3], { front: true });
      p.bodyY *= 0.4;
    },
    surprised(p, c) {
      c.hand("L", [c.sh.L[0] - 44, c.sh.L[1] - 22], { top: true, elbow: [c.sh.L[0] - 36, c.sh.L[1] + 4] });
      c.hand("R", [c.sh.R[0] + 44, c.sh.R[1] - 22], { top: true, elbow: [c.sh.R[0] + 36, c.sh.R[1] + 4] });
    },
    // no stomping: arms folded over the vest, a low rumbling grumble
    upset(p, c) { p.bodyY = 0; p.bodyScaleX = 1 + Math.sin(c.s * 18) * 0.006; p.bodyScaleY = 1; },
    // shoulders slumped, ears drooped sideways, heavy sigh
    sad(p, c) { p.earLRot = 0; p.earRRot = 0; p.earFlatten = 1; p.breath = Math.sin(c.s * 1.1) * 0.03; },
    // hibernating: huge slow breaths, paws on the belly
    sleeping(p, c) {
      p.breath = Math.sin(c.s * 1) * 0.04;
      p.mouthO = 0.6; p.mouthOpen = 0.1 + Math.max(0, Math.sin(c.s * 1)) * 0.25;
      c.hand("L", { at: "belly", dx: -16, dy: 4 }, { front: true });
      c.hand("R", { at: "belly", dx: 16, dy: 4 }, { front: true });
    },
    // paws over the heart, slow sway
    love(p, c) {
      c.hand("L", { at: "chest", dx: -6, dy: 2 }, { front: true });
      c.hand("R", { at: "chest", dx: 8, dy: 4 }, { front: true });
      p.bodyRot = Math.sin(c.s * 1.4) * 4;
    },
  },

  frog: {
    // zen: perfectly still, hands folded, throat slowly pulsing, long slow blinks. Every so often
    // a fly buzzes past: the eyes track it, the tongue snaps it out of the air, a happy gulp.
    idle(p, c) {
      p.bodyY *= 0.3; p.headRot *= 0.3;
      p.throat = 0.25 + Math.sin(c.s * 2.4) * 0.25;
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 7, belly[1] - 2], { front: true });
      c.hand("R", [belly[0] + 7, belly[1] - 2], { front: true });
      const blink = c.quirk(3.4, 0.9, 3, 0.55);
      if (blink >= 0) p.upperLid = Math.max(p.upperLid, plateau(blink, 0.35));
      const ph = c.quirk(7, 2.8, 1, 0.85);
      if (ph >= 0) {
        // the fly circles at the side of the head (head space)
        p.flyX = 186 + Math.sin(c.s * 6.5) * 9;
        p.flyY = 92 + Math.sin(c.s * 10.5) * 7;
        p.fly = ph < 0.6 ? Math.min(1, ph * 8) : 0;
        const look = Math.min(1, ph * 5);
        p.pupilX = ((p.flyX - 150) / 40) * 0.8 * look;
        p.pupilY = ((p.flyY - 82) / 30) * 0.5 * look;
        p.upperLid = Math.min(p.upperLid, 1 - look);
        if (ph > 0.5 && ph < 0.68) p.tongueFlick = Math.sin(((ph - 0.5) / 0.18) * Math.PI);
        if (ph >= 0.66) {
          const g = plateau((ph - 0.66) / 0.34, 0.25);
          p.throat = 1 * g + p.throat * (1 - g);
          p.happyArc = g;
          p.mouthCurve = 0.5 + g * 0.4;
        }
      }
    },
    // springy leap, impossibly wide grin
    happy(p, c) {
      const hop = Math.abs(Math.sin(c.s * 5.5));
      p.bodyY = -hop * 10;
      p.bodyScaleY = 1 + (hop - 0.5) * 0.08; p.bodyScaleX = 1 - (hop - 0.5) * 0.06;
      p.mouthWidth = 1.15;
    },
    // eyes rolled up to the sky, one sticky finger on the chin
    thinking(p) { p.pupilY = -0.7; p.pupilX = -0.1; p.mouthCurve = -0.15; p.bodyY *= 0.3; },
    // the big eyes rolling around, taking it all in
    searching(p, c) {
      p.pupilX = Math.sin(c.s * 2.2) * 0.75;
      p.pupilY = Math.cos(c.s * 3.1) * 0.35;
      c.hand("R", { at: "restR" }, { front: false });
      p.mouthCurve = -0.1;
    },
    // still as a statue, a slow tilt
    listening(p, c) { p.headRot = 6 + Math.sin(c.s * 1.1) * 3; p.bodyY *= 0.2; p.throat = 0.3 + Math.sin(c.s * 2) * 0.2; },
    // brows up, wide croaky mouth, the throat swelling with each word
    speaking(p, c) { p.throat = c.amp * 0.8; p.browLY -= 2; p.browRY -= 2; p.mouthWidth = 1.1; },
    // smug half-lidded focus, tongue poking out the side, pads patting the tasks down
    working(p, c) {
      p.lidSlant = 2;
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 14, belly[1] - 4 + Math.abs(Math.sin(c.s * 7)) * 5], { front: true });
      c.hand("R", [belly[0] + 14, belly[1] - 4 + Math.abs(Math.cos(c.s * 7)) * 5], { front: true });
    },
    surprised(p) { p.eyeScale = 1.25; p.throat = 0.6; },
    // throat puffed out like a balloon, flat stare
    upset(p, c) { p.throat = 0.85 + Math.sin(c.s * 6) * 0.15; p.bodyY = 0; },
    sad(p) { p.throat = 0.1; },
    // meditative: hands folded, slow throat
    sleeping(p, c) {
      p.throat = 0.3 + Math.sin(c.s * 1.3) * 0.3;
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 7, belly[1] - 2], { front: true });
      c.hand("R", [belly[0] + 7, belly[1] - 2], { front: true });
    },
    love(p) { p.mouthWidth = 1.1; },
  },

  otter: {
    // tinkerer: paws busy at the chest turning its lucky pebble; every few seconds it grooms its
    // whiskers with both paws, or stands up tall like a periscope to look around
    idle(p, c) {
      p.tailRot = Math.sin(c.s * 2) * 10;
      p.noseTwitch = Math.sin(c.s * 12) * (Math.sin(c.s * 0.9) > 0.5 ? 0.7 : 0);
      const turn = Math.sin(c.s * 3);
      const pend = c.anchor("pendant");
      let lt = [pend[0] - 7 + turn * 2, pend[1] + 3];
      let rt = [pend[0] + 7 + turn * 2, pend[1] + 5];
      const groom = c.quirk(6.5, 1.8, 1, 0.7);
      if (groom >= 0) {
        const k = plateau(groom, 0.2);
        const scrub = Math.sin(c.s * 14) * 3;
        const cl = c.anchor("cheekL"), cr = c.anchor("cheekR");
        c.hand("L", { at: "cheekL", dx: -2 + (lt[0] - cl[0] + 2) * (1 - k), dy: scrub * k + (lt[1] - cl[1]) * (1 - k) }, { front: true });
        c.hand("R", { at: "cheekR", dx: 2 + (rt[0] - cr[0] - 2) * (1 - k), dy: -scrub * k + (rt[1] - cr[1]) * (1 - k) }, { front: true });
        p.happyArc = Math.max(p.happyArc, k * 0.9);
      } else {
        c.hand("L", lt, { front: true });
        c.hand("R", rt, { front: true });
      }
      const scope = plateau(c.quirk(9.5, 2.6, 2, 0.6), 0.2);
      if (scope > 0) {
        p.bodyScaleY *= 1 + scope * 0.05;
        p.headY -= scope * 7;
        p.headRot += scope * Math.sin(c.s * 2.6) * 10;
        p.pupilX = scope * Math.sin(c.s * 2.6) * 0.6;
      }
    },
    // juggling the pebble from paw to paw
    happy(p, c) {
      const jug = Math.sin(c.s * 11);
      const chest = c.anchor("chest");
      c.hand("L", [chest[0] - 13, chest[1] - 2 + jug * 8], { front: true });
      c.hand("R", [chest[0] + 13, chest[1] - 2 - jug * 8], { front: true });
      p.tailRot = Math.sin(c.s * 14) * 18;
      p.headRot = Math.sin(c.s * 6) * 5;
    },
    // turning the idea over like a stone, tapping its whiskers
    thinking(p, c) { p.headRot = -7; p.noseTwitch = Math.sin(c.s * 10) * 0.6; p.tailRot = Math.sin(c.s * 2.2) * 6; },
    // periscope: stretched up tall, head swivelling, sniffing the breeze
    searching(p, c) {
      p.bodyScaleY *= 1.05;
      p.headY -= 6;
      p.headRot = Math.sin(c.s * 2.2) * 12;
      p.noseTwitch = Math.sin(c.s * 20);
      p.tailRot = -8;
    },
    // head cocked, whiskers twitching with curiosity
    listening(p, c) { p.headRot = 13; p.noseTwitch = Math.sin(c.s * 14) * 0.6; },
    // demonstrating with lively paws
    speaking(p, c) {
      c.hand("L", [c.sh.L[0] - 18, c.sh.L[1] - 14 + Math.sin(c.s * 5) * 6], { front: true });
      c.hand("R", [c.sh.R[0] + 18, c.sh.R[1] - 14 - Math.sin(c.s * 5) * 6], { front: true });
    },
    // nimble paws clicking pieces together
    working(p, c) {
      const w = Math.sin(c.s * 15);
      const belly = c.anchor("belly");
      c.hand("L", [belly[0] - 7 + w * 5, belly[1] - 8], { front: true });
      c.hand("R", [belly[0] + 7 - w * 5, belly[1] - 8], { front: true });
    },
    surprised(p) { p.tailPuff = 1; },
    // arms crossed, tail lashing
    upset(p, c) { p.tailRot = Math.sin(c.s * 10) * 14; },
    // curled small, hugging itself, tail close
    sad(p, c) {
      c.hand("L", { at: "chest", dx: 10, dy: 6 }, { front: true });
      c.hand("R", { at: "chest", dx: -10, dy: 10 }, { front: true });
      p.tailRot = -20;
    },
    // floating on its back in a river: paws folded on the chest, a gentle bob
    sleeping(p, c) {
      const pend = c.anchor("pendant");
      c.hand("L", [pend[0] - 7, pend[1] + 4], { front: true });
      c.hand("R", [pend[0] + 7, pend[1] + 4], { front: true });
      p.bodyY = Math.sin(c.s * 1.4) * 2;
      p.bodyRot = Math.sin(c.s * 0.7) * 2.5;
    },
    // the lucky pebble held close, tail swaying
    love(p, c) {
      const pend = c.anchor("pendant");
      c.hand("L", [pend[0] - 6, pend[1] + 2], { front: true });
      c.hand("R", [pend[0] + 6, pend[1] + 2], { front: true });
      p.tailRot = Math.sin(c.s * 7) * 14;
    },
  },
};

// ---------- props in hand: how each prop changes the acting ----------
// The prop follows its paw everywhere; these only re-place the paws where the prop needs them.

const PROP_ACTING = {
  // coffee in the right paw; idle takes a slow sip every few seconds, eyes closed
  coffee(ex, p, c) {
    const chest = c.anchor("chest");
    const holdAt = [chest[0] + 18, chest[1] + 4];
    if (ex === "idle") {
      const cyc = (c.s % 4.6) / 4.6;
      const k = cyc > 0.62 ? Math.sin(((cyc - 0.62) / 0.38) * Math.PI) : 0;
      const mouth = c.anchor("mouth");
      // a head-attached target that travels from the chest hold up to the mouth
      c.hand("R", { at: "mouth", dx: holdAt[0] - mouth[0] + (10 - (holdAt[0] - mouth[0])) * k, dy: holdAt[1] - mouth[1] + (16 - (holdAt[1] - mouth[1])) * k }, { front: true, elbow: [c.sh.R[0] + 22, chest[1] + 20] });
      p.happyArc = Math.max(p.happyArc, k > 0.55 ? 0.85 : 0);
    } else if (["listening", "sad", "searching", "working", "love", "sleeping", "speaking"].includes(ex)) {
      c.hand("R", holdAt, { front: true, elbow: [c.sh.R[0] + 20, chest[1] + 22] });
    }
  },
  // phone in the right paw: scrolling with both paws, held to the ear while speaking
  phone(ex, p, c) {
    const chest = c.anchor("chest");
    if (ex === "speaking") {
      c.hand("R", { at: "cheekR", dx: 15, dy: 2 }, { front: true, elbow: [c.sh.R[0] + 26, c.sh.R[1] + 20] });
    } else if (["idle", "working", "searching", "sad", "love"].includes(ex)) {
      const scroll = Math.sin(c.s * (ex === "working" ? 9 : 2.4));
      c.hand("R", [chest[0] + 10, chest[1] - 4], { front: true });
      c.hand("L", [chest[0] - 2, chest[1] + 4 + scroll * 3], { front: true });
      if (ex !== "love") {
        p.pupilY = 0.45; p.pupilX = 0.18; p.headY += 2; p.headRot += 3;
      }
    }
  },
  // laptop in front: typing (fast while working), tucked under the arm for big gestures
  laptop(ex, p, c) {
    const belly = c.anchor("belly");
    if (["idle", "working", "listening", "speaking", "sad", "searching", "love"].includes(ex)) {
      const sp = ex === "working" ? 12 : 3;
      const tap = (ph) => Math.abs(Math.sin(c.s * sp + ph)) * (ex === "working" ? 4 : 1.5);
      c.hand("L", [belly[0] - 14, belly[1] - 8 + tap(0)], { front: true });
      c.hand("R", [belly[0] + 14, belly[1] - 8 + tap(1.3)], { front: true });
      if (ex === "idle" || ex === "working") p.pupilY = Math.max(p.pupilY, 0.4);
    }
  },
};

export function evalExpressionPose(expression, t, beatStartMs, ctx) {
  const { characterId, seedUint, amplitude } = ctx;
  const rig = getRig(characterId);
  const p = createBasePose(characterId);
  const c = {
    s: t / 1000,
    elapsed: Math.max(0, t - beatStartMs),
    blink: evalSeededBlink(t, seedUint),
    micro: evalSeededMicroMotion(t, seedUint),
    amp: expression === "speaking" ? evalAmplitude(amplitude, t) : 0,
    characterId,
    rig,
    sh: { L: rig.shoulderL, R: rig.shoulderR },
    anchor: (name) => anchor(rig, name),
    hand: (side, target, opts) => setHand(p, rig, side, target, opts),
    quirk: (windowS, durS, channel, chance) => quirkPhase(t / 1000, seedUint, windowS, durS, channel, chance),
  };
  baseExpression(expression, p, c);
  const act = ACTING[characterId] && ACTING[characterId][expression];
  if (act) act(p, c);
  if (ctx.prop && PROP_ACTING[ctx.prop]) {
    p.bamboo = 0; // the panda puts its bamboo down to hold something else
    PROP_ACTING[ctx.prop](expression, p, c);
  }
  return p;
}

// Click reaction: a hop with a 2D spin (the body flips around) and a happy face.
// phase 0..1 over the reaction's duration; returns the weight of the happy face.
export function applyReaction(pose, phase) {
  if (phase <= 0 || phase >= 1) return 0;
  const hop = Math.sin(phase * Math.PI);
  pose.bodyY -= hop * 26;
  const spin = Math.cos(phase * Math.PI * 2);
  pose.bodyScaleX *= Math.abs(spin) < 0.08 ? (spin < 0 ? -0.08 : 0.08) : spin;
  pose.bodyScaleY *= 1 + hop * 0.04;
  return clamp(Math.min(phase * 5, (1 - phase) * 5), 0, 1);
}
