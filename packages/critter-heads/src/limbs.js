// Two-bone arms: a tiny IK solver plus a cartoon limb renderer (outlined capsule + paw).
// Poses only say where each hand goes (and roughly where the elbow should point);
// the elbow is solved here, so every expression gets natural-looking arms for free.

import { getRig, headPoint } from "./rigdata.js";
import { propHolder, renderHeldProp, laptopOpen } from "./props.js";

const r2 = (n) => Math.round(n * 100) / 100;

// Solve shoulder -> elbow -> hand with fixed bone lengths. The elbow takes the solution
// closest to the hint point. Out-of-reach hands are pulled back to full extension.
export function solveArm(shoulder, hand, upper, fore, hint) {
  const [sx, sy] = shoulder;
  let [hx, hy] = hand;
  let dx = hx - sx;
  let dy = hy - sy;
  let d = Math.hypot(dx, dy) || 0.0001;
  const reach = (upper + fore) * 0.995;
  const minReach = Math.abs(upper - fore) + 1;
  if (d > reach) {
    hx = sx + (dx / d) * reach;
    hy = sy + (dy / d) * reach;
    d = reach;
  } else if (d < minReach) {
    d = minReach;
  }
  const ux = dx / (Math.hypot(dx, dy) || 1);
  const uy = dy / (Math.hypot(dx, dy) || 1);
  const a = (upper * upper - fore * fore + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const bx = sx + ux * a;
  const by = sy + uy * a;
  const e1 = [bx - uy * h, by + ux * h];
  const e2 = [bx + uy * h, by - ux * h];
  const d1 = (e1[0] - hint[0]) ** 2 + (e1[1] - hint[1]) ** 2;
  const d2 = (e2[0] - hint[0]) ** 2 + (e2[1] - hint[1]) ** 2;
  return { shoulder, elbow: d1 <= d2 ? e1 : e2, hand: [hx, hy] };
}

// Resolve one arm from the pose channels (hand position may be head-attached).
export function armPoints(characterId, pose, side) {
  const rig = getRig(characterId);
  const shoulder = side === "L" ? rig.shoulderL : rig.shoulderR;
  const hx = pose[`hand${side}X`];
  const hy = pose[`hand${side}Y`];
  const w = Math.max(0, Math.min(1, pose[`hand${side}Head`] || 0));
  let hand = [hx, hy];
  if (w > 0) {
    const hp = headPoint(rig, pose, hx, hy);
    hand = [hx + (hp[0] - hx) * w, hy + (hp[1] - hy) * w];
  }
  const hint = [pose[`elbow${side}X`], pose[`elbow${side}Y`]];
  return solveArm(shoulder, hand, rig.upper, rig.fore, hint);
}

// handFront: 0 = behind the body, 1 = in front of the body, 2 = on top of everything (raised past the head)
export function armLayer(pose, side) {
  const front = pose[`hand${side}Front`] || 0;
  if (front < 0.5) return "back";
  if (front > 1.5 || (pose[`hand${side}Head`] || 0) > 0.5) return "overHead";
  return "front";
}

function lerpPt(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// style: { kind: "paw" | "wing" | "sleeve" | "pads", color, lowerColor?, lowerFrom?, pawColor, pawR, width, line, cuffColor? }
export function renderArm(pts, style, side) {
  const { shoulder: s, elbow: e, hand: h } = pts;
  const line = style.line;
  const w = style.width;
  const outlineStart = lerpPt(s, e, 0.42); // no outline at the shoulder: the arm melts into the body
  const path = `M ${r2(s[0])} ${r2(s[1])} L ${r2(e[0])} ${r2(e[1])} L ${r2(h[0])} ${r2(h[1])}`;
  const outlinePath = `M ${r2(outlineStart[0])} ${r2(outlineStart[1])} L ${r2(e[0])} ${r2(e[1])} L ${r2(h[0])} ${r2(h[1])}`;
  const ang = (Math.atan2(h[1] - e[1], h[0] - e[0]) * 180) / Math.PI;
  let out = `<g data-arm="${side}">`;
  out += `<path d="${outlinePath}" fill="none" stroke="${line}" stroke-width="${r2(w + 7)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  out += `<path d="${path}" fill="none" stroke="${style.color}" stroke-width="${r2(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

  if (style.kind === "wing") {
    // Feathered wing: three fanned feather tips at the hand, pointing along the forearm.
    const c = style.color;
    out += `<g transform="translate(${r2(h[0])} ${r2(h[1])}) rotate(${r2(ang - 90)})">`;
    for (const [dx, rot, len] of [[-6, 18, 15], [0, 0, 18], [6, -18, 15]]) {
      out += `<ellipse cx="${dx}" cy="${len * 0.55}" rx="5.2" ry="${len * 0.62}" transform="rotate(${rot} ${dx} 0)" fill="${c}" stroke="${line}" stroke-width="3"/>`;
    }
    out += `<circle cx="0" cy="0" r="${r2(w * 0.5)}" fill="${c}"/>`;
    out += `</g>`;
    out += `</g>`;
    return out;
  }

  if (style.kind === "sleeve") {
    // Baggy sleeve with a ribbed cuff, then a small dexterous hand.
    const cuffA = lerpPt(e, h, 0.78);
    const cuffB = lerpPt(e, h, 0.98);
    out += `<path d="M ${r2(cuffA[0])} ${r2(cuffA[1])} L ${r2(cuffB[0])} ${r2(cuffB[1])}" stroke="${line}" stroke-width="${r2(w + 9)}" stroke-linecap="round"/>`;
    out += `<path d="M ${r2(cuffA[0])} ${r2(cuffA[1])} L ${r2(cuffB[0])} ${r2(cuffB[1])}" stroke="${style.cuffColor}" stroke-width="${r2(w + 2)}" stroke-linecap="round"/>`;
    const tip = lerpPt(e, h, 1.18);
    out += `<g transform="translate(${r2(tip[0])} ${r2(tip[1])}) rotate(${r2(ang - 90)})">`;
    out += `<path d="M -6 -4 C -7 4, -5 9, -3 10 L -2 6 L -1 11 L 1 11 L 2 6 L 3 10 C 5 9, 7 4, 6 -4 Z" fill="${style.pawColor}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>`;
    out += `</g></g>`;
    return out;
  }

  if (style.kind === "pads") {
    // Frog hand: three splayed fingers ending in round suction pads.
    const c = style.color;
    out += `<g transform="translate(${r2(h[0])} ${r2(h[1])}) rotate(${r2(ang - 90)})">`;
    let fingers = "";
    let tips = "";
    for (const [rot, len] of [[34, 10], [0, 12], [-34, 10]]) {
      const a = (rot * Math.PI) / 180;
      const fx = r2(-Math.sin(a) * len);
      const fy = r2(Math.cos(a) * len);
      fingers += `M 0 0 L ${fx} ${fy} `;
      tips += `<circle cx="${fx}" cy="${fy}" r="3.6" fill="${c}" stroke="${line}" stroke-width="2.4"/>`;
    }
    out += `<path d="${fingers}" stroke="${line}" stroke-width="8" stroke-linecap="round"/>`;
    out += `<path d="${fingers}" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>`;
    out += `${tips}<circle cx="0" cy="0" r="${r2(w * 0.55)}" fill="${c}"/></g></g>`;
    return out;
  }

  // Paw: optional lower-arm marking (fox socks, cat mittens) + a round mitten paw with toe lines.
  if (style.lowerColor) {
    const from = lerpPt(e, h, style.lowerFrom ?? 0.5);
    out += `<path d="M ${r2(from[0])} ${r2(from[1])} L ${r2(h[0])} ${r2(h[1])}" fill="none" stroke="${style.lowerColor}" stroke-width="${r2(w)}" stroke-linecap="round"/>`;
  }
  const pr = style.pawR;
  out += `<g transform="translate(${r2(h[0])} ${r2(h[1])}) rotate(${r2(ang - 90)})">`;
  out += `<ellipse cx="0" cy="${r2(pr * 0.35)}" rx="${r2(pr)}" ry="${r2(pr * 1.08)}" fill="${style.pawColor}" stroke="${line}" stroke-width="3"/>`;
  out += `<path d="M ${r2(-pr * 0.32)} ${r2(pr * 0.75)} L ${r2(-pr * 0.32)} ${r2(pr * 1.2)} M ${r2(pr * 0.32)} ${r2(pr * 0.75)} L ${r2(pr * 0.32)} ${r2(pr * 1.2)}" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>`;
  out += `</g></g>`;
  return out;
}

// Render every arm that belongs to `layer` ("back" | "front" | "overHead").
// In bust view only raised (front) arms are drawn, clipped at the bust's bottom edge.
// held: { prop, t } when the critter holds a prop; it's drawn right before the holding arm.
export function renderArms(characterId, pose, style, layer, view, uid, bustBottom = 192, held = null) {
  let out = "";
  const holder = held && held.prop ? propHolder(held.prop, pose) : null;
  // an open laptop faces the critter: its screen sits IN FRONT of both paws (only the elbows show)
  const laptopOnTop = held && held.prop === "laptop" && laptopOpen(pose);
  let onTop = "";
  for (const side of ["R", "L"]) {
    const lay = armLayer(pose, side);
    if (lay !== layer) continue;
    if (view === "bust" && lay === "back") continue;
    const pts = armPoints(characterId, pose, side);
    if (holder === side) {
      const other = armPoints(characterId, pose, side === "R" ? "L" : "R");
      const prop = renderHeldProp(held.prop, pose, held.t, style.line, pts, other);
      if (laptopOnTop) onTop = prop;
      else out += prop;
    }
    out += renderArm(pts, style, side);
  }
  out += onTop;
  if (!out) return "";
  if (view === "bust") {
    const id = `${uid}-bustclip-${layer}`;
    return `<defs><clipPath id="${id}"><rect x="-40" y="-40" width="320" height="${bustBottom + 40}"/></clipPath></defs><g clip-path="url(#${id})">${out}</g>`;
  }
  return out;
}
