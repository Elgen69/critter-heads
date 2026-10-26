// Expression timeline: beats -> blended pose at time t, plus lookAt and the click reaction.
// Pure function of (config, t): seeking 4000 -> 1000 -> 4000 gives identical frames.

import { clamp, lerp, seedToUint32 } from "./math.js";
import { POSE_KEYS, createBasePose, evalExpressionPose, applyReaction } from "./poses.js";

export * from "./math.js";
export { POSE_KEYS, createBasePose, evalExpressionPose };

export const EXPRESSIONS = [
  "idle", "happy", "thinking", "searching", "listening", "speaking",
  "working", "surprised", "upset", "sad", "sleeping", "love",
];

export const CHARACTER_IDS = ["fox", "owl", "cat", "raccoon", "panda", "dog", "bunny", "bear", "frog", "otter"];

// Face channels switch faster than the body, so a new expression reads right away.
const FACE_KEYS = new Set([
  "browLY", "browRY", "browLRot", "browRRot", "eyeScale", "pupilScale", "upperLid", "lowerLid", "lidSlant",
  "lidLExtra", "lidRExtra", "happyArc", "sleepArc", "heartEyes", "tear", "blush", "loveBlush",
  "mouthOpen", "mouthWidth", "mouthCurve", "mouthSkew", "mouthO", "tongueOut",
]);

// fast start, soft landing: the switch is already ~half done after a quarter of the blend
const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

export function blendPoses(poseA, poseB, alpha, faceAlpha = alpha) {
  const t = clamp(alpha, 0, 1);
  const tf = clamp(faceAlpha, 0, 1);
  if (t <= 0 && tf <= 0) return poseA;
  if (t >= 1 && tf >= 1) return poseB;
  const out = {};
  for (let i = 0; i < POSE_KEYS.length; i++) {
    const k = POSE_KEYS[i];
    out[k] = lerp(poseA[k], poseB[k], FACE_KEYS.has(k) ? tf : t);
  }
  return out;
}

// Normalize beats into sorted [{ ms, expression, options }]
export function normalizeBeats(beats) {
  if (!Array.isArray(beats) || beats.length === 0) {
    return [{ ms: 0, expression: "idle", options: {} }];
  }
  const list = [];
  for (const entry of beats) {
    if (Array.isArray(entry)) {
      const ms = Math.max(0, Number(entry[0]) || 0);
      const expr = EXPRESSIONS.includes(entry[1]) ? entry[1] : "idle";
      const opts = entry[2] && typeof entry[2] === "object" ? entry[2] : {};
      list.push({ ms, expression: expr, options: opts });
    } else if (entry && typeof entry === "object") {
      const ms = Math.max(0, Number(entry.ms ?? entry.time) || 0);
      const expr = EXPRESSIONS.includes(entry.expression) ? entry.expression : "idle";
      list.push({ ms, expression: expr, options: entry.options || {} });
    }
  }
  if (list.length === 0) return [{ ms: 0, expression: "idle", options: {} }];
  list.sort((a, b) => a.ms - b.ms);
  return list;
}

export function evaluateRigAtTime(t, config) {
  const {
    characterId = "fox",
    beats = [[0, "idle"]],
    transitionMs = 300,
    seed = 0.42,
    amplitude = null,
    lookAt = { x: 0, y: 0 },
    reaction = null, // { at: ms, durationMs?: number }
    prop = null,
  } = config;

  const sortedBeats = normalizeBeats(beats);
  const seedUint = seedToUint32(seed);
  const ctx = { characterId, seedUint, amplitude, prop };

  let activeIdx = 0;
  for (let i = 0; i < sortedBeats.length; i++) {
    if (sortedBeats[i].ms <= t) activeIdx = i;
    else break;
  }

  // walk back to the earliest beat still blending into t
  let startIdx = activeIdx;
  while (startIdx > 0) {
    const b = sortedBeats[startIdx];
    const dur = Math.max(0, Number(b.options?.transitionMs ?? transitionMs));
    if (t - b.ms < dur) startIdx--;
    else break;
  }

  let pose = evalExpressionPose(sortedBeats[startIdx].expression, t, sortedBeats[startIdx].ms, ctx);
  for (let i = startIdx + 1; i <= activeIdx; i++) {
    const b = sortedBeats[i];
    const dur = Math.max(0, Number(b.options?.transitionMs ?? transitionMs));
    const raw = dur > 0 ? clamp((t - b.ms) / dur, 0, 1) : 1;
    pose = blendPoses(pose, evalExpressionPose(b.expression, t, b.ms, ctx), easeOutCubic(raw), easeOutCubic(raw / 0.45));
  }

  // switch "pop": a quick squash-and-stretch the moment the expression changes (instant feedback)
  if (activeIdx > 0) {
    const e = t - sortedBeats[activeIdx].ms;
    if (e >= 0 && e < 360) {
      const k = Math.sin((e / 360) * Math.PI * 2) * Math.exp(-e / 110);
      pose = { ...pose };
      pose.bodyScaleY *= 1 - k * 0.06;
      pose.bodyScaleX *= 1 + k * 0.05;
    }
  }

  // click reaction: hop + spin + a happy face
  if (reaction && Number.isFinite(reaction.at)) {
    const dur = reaction.durationMs || 950;
    const phase = (t - reaction.at) / dur;
    if (phase > 0 && phase < 1) {
      const happy = evalExpressionPose("happy", t, reaction.at, ctx);
      const hopPose = { ...pose };
      const w = applyReaction(hopPose, phase);
      pose = blendPoses(pose, happy, w);
      pose.bodyY = hopPose.bodyY;
      pose.bodyScaleX = hopPose.bodyScaleX;
      pose.bodyScaleY = hopPose.bodyScaleY;
    }
  }

  // 2.5D lookAt: eyes lead, head follows
  const lx = clamp(Number(lookAt?.x) || 0, -1, 1);
  const ly = clamp(Number(lookAt?.y) || 0, -1, 1);
  pose = { ...pose };
  pose.lookX = lx;
  pose.lookY = ly;
  pose.pupilX = clamp(pose.pupilX + lx * 0.65, -0.88, 0.88);
  pose.pupilY = clamp(pose.pupilY + ly * 0.6, -0.82, 0.82);
  pose.headX += lx * 5.5;
  pose.headY += ly * 4.0;
  pose.headRot += lx * 4.5;

  return { pose, activeExpression: sortedBeats[activeIdx].expression, timeMs: t, seedUint };
}
