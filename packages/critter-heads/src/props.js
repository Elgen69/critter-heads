// Hand-held props, drawn in code and attached to the paw that holds them.
// The pose side (how the critter uses the prop) lives in poses.js → PROP_ACTING.

const r2 = (n) => Math.round(n * 100) / 100;

export const PROPS = ["coffee", "phone", "laptop"];

// The laptop is open when both paws are in front of the body, close together, at keyboard height.
export function laptopOpen(pose) {
  return (
    (pose.handLFront || 0) > 0.5 &&
    (pose.handRFront || 0) > 0.5 &&
    (pose.handLHead || 0) < 0.5 &&
    (pose.handRHead || 0) < 0.5 &&
    Math.abs(pose.handLX - pose.handRX) < 46 &&
    Math.abs(pose.handLY - pose.handRY) < 16
  );
}

// Which paw carries the prop right now (the prop is drawn just before that arm, so the paw wraps it).
export function propHolder(prop, pose) {
  if (prop === "laptop") {
    if (laptopOpen(pose)) return "R";
    // closed laptop goes to the lower paw (never the one up at the chin)
    return (pose.handLHead || 0) > 0.5 ? "R" : (pose.handRHead || 0) > 0.5 ? "L" : pose.handLY >= pose.handRY ? "L" : "R";
  }
  return "R";
}

// pts: the holding arm's solved points; pts2: the other arm's (laptop needs both)
export function renderHeldProp(prop, pose, timeMs, line, pts, pts2) {
  const [hx, hy] = pts.hand;
  if (prop === "coffee") {
    const s = timeMs / 1000;
    const steam = (dx, ph) => {
      const o = r2(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(s * 2.2 + ph)));
      const sway = r2(Math.sin(s * 1.7 + ph) * 2.5);
      return `<path d="M ${dx} -15 C ${dx + sway} -21, ${dx - sway} -25, ${dx} -31" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="${o}"/>`;
    };
    return `<g data-prop="coffee" transform="translate(${r2(hx)} ${r2(hy - 5)})">
      ${steam(-3, 0)}${steam(4, 1.7)}
      <path d="M -9 -11 L 9 -11 L 7 13 C 7 15, -7 15, -7 13 Z" fill="#F6F1EA" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M -8.4 -2 L 8.4 -2 L 7.7 7 L -7.7 7 Z" fill="#B07A4F" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-10.5" y="-15" width="21" height="5" rx="2.5" fill="#3A2A24" stroke="${line}" stroke-width="2"/>
    </g>`;
  }
  if (prop === "phone") {
    return `<g data-prop="phone" transform="translate(${r2(hx)} ${r2(hy - 8)}) rotate(-8) scale(1.25)">
      <rect x="-8" y="-14" width="16" height="28" rx="3.5" fill="#20232D" stroke="${line}" stroke-width="2.6"/>
      <rect x="-5.6" y="-11" width="11.2" height="20" rx="1.8" fill="#7FE7FF" opacity="0.92"/>
      <path d="M -3.5 -6 L 3.5 -6 M -3.5 -2 L 2 -2 M -3.5 2 L 3 2" stroke="#20232D" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>
    </g>`;
  }
  if (prop === "laptop") {
    if (laptopOpen(pose) && pts2) {
      const mx = (pts.hand[0] + pts2.hand[0]) / 2;
      const my = Math.max(pts.hand[1], pts2.hand[1]);
      return `<g data-prop="laptop" transform="translate(${r2(mx)} ${r2(my + 16)})">
        <rect x="-33" y="-46" width="66" height="42" rx="5" fill="#C9CED8" stroke="${line}" stroke-width="2.8"/>
        <path d="M -27 -42 L 27 -42" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <circle cx="0" cy="-25" r="5" fill="#E8743B" stroke="${line}" stroke-width="1.8"/>
        <path d="M -38 -4 L 38 -4 L 34 3 L -34 3 Z" fill="#9AA1AE" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
      </g>`;
    }
    // closed, tucked under the arm
    return `<g data-prop="laptop" transform="translate(${r2(hx + 2)} ${r2(hy - 18)}) rotate(8)">
      <rect x="-4.5" y="-24" width="9" height="48" rx="3" fill="#C9CED8" stroke="${line}" stroke-width="2.6"/>
      <path d="M -1.5 -20 L -1.5 20" stroke="#FFFFFF" stroke-width="1.6" opacity="0.5"/>
    </g>`;
  }
  return "";
}
