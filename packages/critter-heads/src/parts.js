// Shared vector rig primitives: color shading, eyes, eyelids, mouths, beaks, blush, and FX.

import { clamp, lerp } from "./rig.js";

export function f(n) {
  return Math.round(n * 100) / 100;
}

export function tr(x = 0, y = 0, rot = 0, sx = 1, sy = 1, px = 0, py = 0) {
  const parts = [];
  if (x !== 0 || y !== 0) {
    parts.push(`translate(${f(x)} ${f(y)})`);
  }
  if (rot !== 0) {
    if (px !== 0 || py !== 0) {
      parts.push(`rotate(${f(rot)} ${f(px)} ${f(py)})`);
    } else {
      parts.push(`rotate(${f(rot)})`);
    }
  }
  if (sx !== 1 || sy !== 1) {
    if (px !== 0 || py !== 0) {
      parts.push(`translate(${f(px)} ${f(py)}) scale(${f(sx)} ${f(sy)}) translate(${f(-px)} ${f(-py)})`);
    } else {
      parts.push(`scale(${f(sx)} ${f(sy)})`);
    }
  }
  return parts.length ? ` transform="${parts.join(" ")}"` : "";
}

// Parse hex color (#RRGGBB or #RGB) and shade by amount (-1..1)
export function shadeColor(hex, amount) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  let clean = hex.slice(1).trim();
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return hex;
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  if (amount >= 0) {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else {
    const factor = 1 + amount;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }
  const toHex = (c) => clamp(c, 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Contact shadow under full body or bust
export function renderShadow(view, shadowEnabled, bodyScaleX = 1) {
  if (!shadowEnabled) return "";
  bodyScaleX = Math.max(0.6, Math.abs(bodyScaleX)); // the click-spin flips the body; the shadow just narrows
  if (view === "bust") {
    return `<ellipse cx="120" cy="195" rx="${f(54 * bodyScaleX)}" ry="7" fill="#18181B" fill-opacity="0.16"/>`;
  }
  return `<ellipse cx="120" cy="278" rx="${f(62 * bodyScaleX)}" ry="11" fill="#18181B" fill-opacity="0.18"/>`;
}

// Floating love hearts (deterministic function of timeMs)
export function renderLoveHearts(pose, timeMs, lineColor) {
  if (pose.loveBlush <= 0.05) return "";
  const alpha = f(clamp(pose.loveBlush, 0, 1));
  const s = timeMs / 1000;
  const items = [
    { baseX: 56, baseY: 62, speed: 1.4, phase: 0.0, scale: 0.78 },
    { baseX: 184, baseY: 56, speed: 1.6, phase: 2.1, scale: 0.85 },
    { baseX: 170, baseY: 28, speed: 1.2, phase: 4.2, scale: 0.62 },
  ];
  let out = `<g opacity="${alpha}">`;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const cycle = (s * it.speed + it.phase) % 2.4;
    const norm = cycle / 2.4;
    const yOff = -norm * 18;
    const xOff = Math.sin(s * 3 + it.phase) * 4;
    const op = f(Math.sin(norm * Math.PI) * 0.9);
    const cx = f(it.baseX + xOff);
    const cy = f(it.baseY + yOff);
    out += `<path d="M 0 3 C -2 -2 -9 -1 -9 4 C -9 9 0 13 0 16 C 0 13 9 9 9 4 C 9 -1 2 -2 0 3 Z" fill="#F46B8A" stroke="${lineColor}" stroke-width="1.8" opacity="${op}" transform="translate(${cx} ${cy}) scale(${it.scale})"/>`;
  }
  out += `</g>`;
  return out;
}

// Cheek blush + love nose-bridge blush
export function renderCheekBlush(pose, cfg) {
  const {
    leftX = 80,
    rightX = 160,
    y = 122,
    rx = 11,
    ry = 6,
    color = "#F48B94",
  } = cfg;
  const blushVal = clamp(pose.blush, 0, 1);
  const loveVal = clamp(pose.loveBlush, 0, 1);
  if (blushVal <= 0.01 && loveVal <= 0.01) return "";
  let svg = "";
  if (loveVal > 0.02) {
    svg += `<ellipse cx="120" cy="${f(y - 6)}" rx="${f((rightX - leftX) * 0.56)}" ry="${f(ry * 1.65)}" fill="#F26B8A" fill-opacity="${f(loveVal * 0.28)}"/>`;
  }
  if (blushVal > 0.01) {
    const op = f(blushVal * 0.58 + loveVal * 0.2);
    const sRx = f(rx * (1 + loveVal * 0.18));
    const sRy = f(ry * (1 + loveVal * 0.15));
    svg += `<ellipse cx="${f(leftX)}" cy="${f(y)}" rx="${sRx}" ry="${sRy}" fill="${color}" fill-opacity="${op}"/>`;
    svg += `<ellipse cx="${f(rightX)}" cy="${f(y)}" rx="${sRx}" ry="${sRy}" fill="${color}" fill-opacity="${op}"/>`;
  }
  return svg;
}

// Render both eyes with clip paths, iris, pupils, heart-eyes, eyelids, happy/sleep arcs, and sad tear
export function renderEyes(pose, cfg, uid) {
  const {
    leftX = 91,
    rightX = 149,
    y = 104,
    rx = 15,
    ry = 14,
    scleraColor = "#FFFFFF",
    irisColor = "#2FB8A6",
    pupilColor = "#1C1D24",
    lidColor = "#E8743B",
    lineColor = "#2E2A33",
    almond = false,
    irisRatio = 0.76,
    pupilRatio = 0.48,
    heartColor = "#F06482",
    heartStroke = "",
    outline = true, // bead eyes (bear) skip the ring so a lowered lid reads as a half-closed eye
  } = cfg;

  const arcWeight = clamp(Math.max(pose.happyArc, pose.sleepArc), 0, 1);
  const openOpacity = f(1 - arcWeight);
  const scale = clamp(pose.eyeScale, 0.85, 1.25);

  const renderSingleEye = (cx, side, idx) => {
    const clipId = `${uid}-eye-${idx}`;
    const isLeft = side < 0;
    const erx = f(rx * scale);
    const ery = f(ry * scale);

    // Eye aperture shape (almond vs oval)
    let eyeShape = "";
    if (almond) {
      const tilt = isLeft ? 4 : -4;
      eyeShape = `<path d="M ${f(cx - erx)} ${f(y + 1)} C ${f(cx - erx * 0.65)} ${f(y - ery * 1.15)}, ${f(cx + erx * 0.65)} ${f(y - ery * 1.15)}, ${f(cx + erx)} ${f(y + 1)} C ${f(cx + erx * 0.6)} ${f(y + ery * 1.05)}, ${f(cx - erx * 0.6)} ${f(y + ery * 1.05)}, ${f(cx - erx)} ${f(y + 1)} Z" transform="rotate(${tilt} ${cx} ${y})"/>`;
    } else {
      eyeShape = `<ellipse cx="${cx}" cy="${y}" rx="${erx}" ry="${ery}"/>`;
    }

    // Gaze offset
    const maxShiftX = rx * 0.36;
    const maxShiftY = ry * 0.34;
    const gx = f(cx + pose.pupilX * maxShiftX);
    const gy = f(y + pose.pupilY * maxShiftY);

    const irx = f(rx * irisRatio * scale * lerp(1, 0.86, clamp(pose.eyeScale - 1, 0, 0.3) * 2.5));
    const iry = f(ry * irisRatio * scale * lerp(1, 0.86, clamp(pose.eyeScale - 1, 0, 0.3) * 2.5));
    const prx = f(irx * pupilRatio * pose.pupilScale);
    const pry = f(iry * pupilRatio * pose.pupilScale);

    // Heart pupil overlay for `love`
    let heartSvg = "";
    if (pose.heartEyes > 0.02) {
      const hop = f(clamp(pose.heartEyes, 0, 1));
      const hScale = f((rx / 14) * (0.75 + 0.35 * hop));
      const hStroke = heartStroke || lineColor;
      heartSvg = `<g opacity="${hop}" transform="translate(${gx} ${f(gy - 2)}) scale(${hScale})">
        <path d="M 0 -4 C -3 -10 -11 -8 -11 -1 C -11 5 0 11 0 14 C 0 11 11 5 11 -1 C 11 -8 3 -10 0 -4 Z" fill="${heartColor}" stroke="${hStroke}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="-4" cy="-3" r="2.1" fill="#FFFFFF" fill-opacity="0.88"/>
      </g>`;
    }

    // Upper eyelid closure and slant
    let lidSvg = "";
    const lidAmt = clamp(pose.upperLid + ((isLeft ? pose.lidLExtra : pose.lidRExtra) || 0), 0, 1);
    if (lidAmt > 0.02) {
      const lidBottomY = f(y - ery * 1.05 + lidAmt * ery * 2.15);
      const slantDeg = f(isLeft ? pose.lidSlant : -pose.lidSlant);
      const w = f(erx * 1.45);
      lidSvg = `<g transform="rotate(${slantDeg} ${cx} ${y})">
        <rect x="${f(cx - w)}" y="${f(y - ery * 1.8)}" width="${f(w * 2)}" height="${f(ery * 1.8 + (lidBottomY - (y - ery * 1.05)))}" fill="${lidColor}"/>
        <line x1="${f(cx - w)}" y1="${lidBottomY}" x2="${f(cx + w)}" y2="${lidBottomY}" stroke="${lineColor}" stroke-width="3.4" stroke-linecap="round"/>
      </g>`;
    }

    // Happy (^ ^) or Sleeping (v v) closed eye arcs
    let arcSvg = "";
    if (arcWeight > 0.02) {
      const aop = f(arcWeight);
      const isHappy = pose.happyArc >= pose.sleepArc;
      const aw = erx * 0.88;
      if (isHappy) {
        arcSvg = `<path d="M ${f(cx - aw)} ${f(y + 3)} Q ${cx} ${f(y - ery * 0.85)} ${f(cx + aw)} ${f(y + 3)}" fill="none" stroke="${lineColor}" stroke-width="4.2" stroke-linecap="round" opacity="${aop}"/>`;
      } else {
        arcSvg = `<path d="M ${f(cx - aw)} ${f(y - 1)} Q ${cx} ${f(y + ery * 0.72)} ${f(cx + aw)} ${f(y - 1)}" fill="none" stroke="${lineColor}" stroke-width="4.0" stroke-linecap="round" opacity="${aop}"/>`;
      }
    }

    // Sad tear on the right eye (viewer's right, matching all expression designs)
    let tearSvg = "";
    if (!isLeft && pose.tear > 0.02) {
      const top = f(clamp(pose.tear, 0, 1));
      const tx = f(cx + erx * 0.76);
      const ty = f(y + ery * 0.55);
      tearSvg = `<g opacity="${top}" transform="translate(${tx} ${ty}) rotate(14)">
        <path d="M 0 0 C -3 5 -5.5 9 -5.5 12.5 C -5.5 15.8 -3 18 0 18 C 3 18 5.5 15.8 5.5 12.5 C 5.5 9 3 5 0 0 Z" fill="#7AD7F7" stroke="${lineColor}" stroke-width="2.4" stroke-linejoin="round"/>
        <ellipse cx="-1.5" cy="12" rx="1.3" ry="2.2" fill="#FFFFFF" fill-opacity="0.85"/>
      </g>`;
    }

    const normalIrisOpacity = f(1 - clamp(pose.heartEyes * 1.15, 0, 1));

    return `<g>
      <defs><clipPath id="${clipId}">${eyeShape}</clipPath></defs>
      <g opacity="${openOpacity}">
        <g clip-path="url(#${clipId})">
          <rect x="${f(cx - erx - 4)}" y="${f(y - ery - 4)}" width="${f((erx + 4) * 2)}" height="${f((ery + 4) * 2)}" fill="${scleraColor}"/>
          <g opacity="${normalIrisOpacity}">
            <ellipse cx="${gx}" cy="${gy}" rx="${irx}" ry="${iry}" fill="${irisColor}" stroke="${lineColor}" stroke-width="1.8"/>
            <ellipse cx="${gx}" cy="${f(gy + iry * 0.15)}" rx="${f(irx * 0.82)}" ry="${f(iry * 0.72)}" fill="${shadeColor(irisColor, -0.14)}"/>
            <ellipse cx="${gx}" cy="${gy}" rx="${prx}" ry="${pry}" fill="${pupilColor}"/>
            <circle cx="${f(gx - irx * 0.34)}" cy="${f(gy - iry * 0.34)}" r="${f(Math.max(2.6, rx * 0.24))}" fill="#FFFFFF"/>
            <circle cx="${f(gx + irx * 0.28)}" cy="${f(gy + iry * 0.28)}" r="${f(Math.max(1.3, rx * 0.11))}" fill="#FFFFFF" fill-opacity="0.9"/>
          </g>
          ${heartSvg}
          ${lidSvg}
        </g>
        ${outline ? `<g fill="none" stroke="${lineColor}" stroke-width="3.6" stroke-linejoin="round">${eyeShape}</g>` : ""}
      </g>
      ${arcSvg}
      ${tearSvg}
    </g>`;
  };

  return `${renderSingleEye(leftX, -1, 0)}${renderSingleEye(rightX, 1, 1)}`;
}

// Render left and right eyebrows
export function renderBrows(pose, cfg) {
  const {
    leftX = 89,
    rightX = 151,
    y = 80,
    width = 18,
    thickness = 4.5,
    color = "#2E2A33",
    style = "pill", // "pill" | "bean" | "arch"
    stroke = "",
  } = cfg;

  const renderOne = (cx, side) => {
    const isLeft = side < 0;
    const by = f(y + (isLeft ? pose.browLY : pose.browRY));
    const brot = f(isLeft ? pose.browLRot : pose.browRRot);
    const hw = f(width / 2);

    if (style === "bean") {
      return `<ellipse cx="${cx}" cy="${by}" rx="${hw}" ry="${f(thickness)}" fill="${color}" ${stroke ? `stroke="${stroke}" stroke-width="2.2"` : ""} transform="rotate(${brot} ${cx} ${by})"/>`;
    }
    if (style === "arch") {
      return `<path d="M ${f(cx - hw)} ${f(by + 2)} Q ${cx} ${f(by - thickness * 1.4)} ${f(cx + hw)} ${f(by + 2)}" fill="none" stroke="${color}" stroke-width="${f(thickness * 1.4)}" stroke-linecap="round" transform="rotate(${brot} ${cx} ${by})"/>`;
    }
    return `<path d="M ${f(cx - hw)} ${by} Q ${cx} ${f(by - 2.5)} ${f(cx + hw)} ${by}" fill="none" stroke="${color}" stroke-width="${f(thickness)}" stroke-linecap="round" transform="rotate(${brot} ${cx} ${by})"/>`;
  };

  return `<g>${renderOne(leftX, -1)}${renderOne(rightX, 1)}</g>`;
}

// Parametric mammalian mouth (Fox, Cat, Raccoon, Panda)
export function renderMouth(pose, cfg, uid) {
  const {
    cx = 120,
    cy = 132,
    width = 24,
    lineColor = "#2E2A33",
    splitSmile = true, // w-shaped (:3) mouth in calm positive states
    noseBottomY = 126,
  } = cfg;

  const open = clamp(pose.mouthOpen, 0, 1);
  const oWeight = clamp(pose.mouthO, 0, 1);
  const curve = clamp(pose.mouthCurve, -1, 1);
  const w = (width * 0.5) * clamp(pose.mouthWidth, 0.35, 1.35);
  const skewY = pose.mouthSkew * 3.2;

  let svg = `<g>`;

  // Surprised / Sleeping "o" oval mouth
  if (oWeight > 0.35) {
    const rx = f(Math.max(4.5, w * 0.55));
    const ry = f(Math.max(4.5, 4 + open * 7.5));
    const clipId = `${uid}-mouth-o`;
    svg += `<defs><clipPath id="${clipId}"><ellipse cx="${cx}" cy="${f(cy + 2)}" rx="${rx}" ry="${ry}"/></clipPath></defs>`;
    svg += `<ellipse cx="${cx}" cy="${f(cy + 2)}" rx="${rx}" ry="${ry}" fill="#5B222C"/>`;
    svg += `<ellipse cx="${cx}" cy="${f(cy + 2 + ry * 0.55)}" rx="${f(rx * 0.85)}" ry="${f(ry * 0.65)}" fill="#F2828B" clip-path="url(#${clipId})"/>`;
    svg += `<ellipse cx="${cx}" cy="${f(cy + 2)}" rx="${rx}" ry="${ry}" fill="none" stroke="${lineColor}" stroke-width="3.2"/>`;
    svg += `</g>`;
    return svg;
  }

  // Open mouth (Happy laugh or Speaking amplitude)
  if (open > 0.14) {
    const openH = f(6 + open * 13);
    const topY = f(cy - 1);
    const botY = f(cy - 1 + openH);
    const topCtrlY = f(topY + curve * 3.5);
    const pathD = `M ${f(cx - w)} ${f(topY - skewY * 0.4)} Q ${cx} ${topCtrlY} ${f(cx + w)} ${f(topY + skewY * 0.4)} C ${f(cx + w * 0.92)} ${botY}, ${f(cx - w * 0.92)} ${botY}, ${f(cx - w)} ${f(topY - skewY * 0.4)} Z`;
    const clipId = `${uid}-mouth-open`;
    svg += `<defs><clipPath id="${clipId}"><path d="${pathD}"/></clipPath></defs>`;
    svg += `<path d="${pathD}" fill="#5B222C"/>`;
    svg += `<ellipse cx="${cx}" cy="${f(botY - openH * 0.12)}" rx="${f(w * 0.72)}" ry="${f(openH * 0.48)}" fill="#F2828B" clip-path="url(#${clipId})"/>`;
    svg += `<path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="3.2" stroke-linejoin="round"/>`;
    svg += `</g>`;
    return svg;
  }

  // Working tongue sticking out at the right corner
  if (pose.tongueOut > 0.15) {
    const tOp = f(clamp(pose.tongueOut, 0, 1));
    const tx = f(cx + w * 0.48);
    const ty = f(cy + 1.5);
    svg += `<g opacity="${tOp}" transform="translate(${tx} ${ty}) rotate(-14)">
      <path d="M -4.5 0 C -5 6.5 -2.5 10 0.5 10 C 3.8 10 5.5 6.5 4.8 0 Z" fill="#F27D88" stroke="${lineColor}" stroke-width="2.8" stroke-linejoin="round"/>
      <line x1="0" y1="1.5" x2="0.2" y2="6.8" stroke="${lineColor}" stroke-width="1.8" stroke-linecap="round"/>
    </g>`;
  }

  // Closed mouth line (split :3 smile vs single curve/frown/slant)
  if (splitSmile && curve > 0.15 && Math.abs(pose.mouthSkew) < 0.25) {
    const dip = f(3.5 + curve * 4.2);
    svg += `<path d="M ${cx} ${f(noseBottomY)} L ${cx} ${f(cy - 1)} M ${f(cx - w)} ${f(cy - 0.5)} Q ${f(cx - w * 0.5)} ${f(cy + dip)} ${cx} ${f(cy - 1)} Q ${f(cx + w * 0.5)} ${f(cy + dip)} ${f(cx + w)} ${f(cy - 0.5)}" fill="none" stroke="${lineColor}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    const ctrlY = f(cy + curve * 8.5);
    const yL = f(cy - curve * 2.2 - skewY);
    const yR = f(cy - curve * 2.2 + skewY);
    svg += `<path d="M ${f(cx - w)} ${yL} Q ${cx} ${ctrlY} ${f(cx + w)} ${yR}" fill="none" stroke="${lineColor}" stroke-width="3.3" stroke-linecap="round"/>`;
  }

  svg += `</g>`;
  return svg;
}

// Owl's two-part articulated beak (matches owl_turnaround.jpg & owl_expressions.jpg)
export function renderOwlBeak(pose, cfg) {
  const {
    cx = 120,
    cy = 117,
    beakColor = "#E0A23B",
    lineColor = "#2E241D",
  } = cfg;

  const open = clamp(pose.mouthOpen, 0, 1);
  const oWeight = clamp(pose.mouthO, 0, 1);
  const beakDark = shadeColor(beakColor, -0.16);
  const beakLight = shadeColor(beakColor, 0.22);

  let svg = `<g transform="translate(${f(cx)} ${f(cy)})">`;

  // Working side tongue peeking from under the beak
  if (pose.tongueOut > 0.15) {
    const tOp = f(clamp(pose.tongueOut, 0, 1));
    svg += `<g opacity="${tOp}" transform="translate(6 7) rotate(-20)">
      <path d="M -4 0 C -4.5 6.5 -2 9.5 1 9.5 C 4 9.5 5 6.5 4.2 0 Z" fill="#F07B86" stroke="${lineColor}" stroke-width="2.6"/>
      <line x1="0" y1="1.5" x2="0.2" y2="6.2" stroke="${lineColor}" stroke-width="1.6" stroke-linecap="round"/>
    </g>`;
  }

  // Open lower beak cavity (happy, speaking, surprised, love)
  if (open > 0.12 || oWeight > 0.2) {
    const drop = f(4 + open * 9);
    const w = f(oWeight > 0.4 ? 7.5 : 9.5);
    svg += `<path d="M ${-w} 2 Q 0 ${f(drop + 9)} ${w} 2 Z" fill="${beakDark}" stroke="${lineColor}" stroke-width="3" stroke-linejoin="round"/>`;
    svg += `<path d="M ${f(-w * 0.78)} 2 Q 0 ${f(drop + 6)} ${f(w * 0.78)} 2 Z" fill="#63232C"/>`;
    svg += `<ellipse cx="0" cy="${f(4 + drop * 0.45)}" rx="${f(w * 0.52)}" ry="${f(2.2 + drop * 0.22)}" fill="#F0808A"/>`;
  } else if (pose.mouthCurve < -0.35) {
    // Upset / Sad scowl under beak
    svg += `<path d="M -9 7 Q 0 2 9 7" fill="none" stroke="${lineColor}" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    // Closed lower beak rim
    svg += `<path d="M -7.5 2 Q 0 13 7.5 2" fill="${beakDark}" stroke="${lineColor}" stroke-width="2.8" stroke-linejoin="round"/>`;
  }

  // Upper hooked owl beak
  const hookY = f(open > 0.2 ? 7.5 : 10.5);
  svg += `<path d="M -10.5 0 C -8 -8, 8 -8, 10.5 0 C 8.5 5, 3.5 ${hookY}, 0 ${hookY} C -3.5 ${hookY}, -8.5 5, -10.5 0 Z" fill="${beakColor}" stroke="${lineColor}" stroke-width="3.2" stroke-linejoin="round"/>`;
  svg += `<ellipse cx="-2.5" cy="-2" rx="3.2" ry="1.8" fill="${beakLight}" fill-opacity="0.75" transform="rotate(-18 -2.5 -2)"/>`;
  svg += `</g>`;
  return svg;
}
