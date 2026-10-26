// Moss the Tree Frog (id: "frog") — layered vector rig matching frog_turnaround.jpg & frog_expressions.jpg.

import {
  f,
  tr,
  shadeColor,
  renderShadow,
  renderLoveHearts,
  renderCheekBlush,
  renderEyes,
  renderBrows,
} from "../parts.js";
import { clamp } from "../rig.js";
import { renderArms } from "../limbs.js";

const HEAD = "M 120 88 C 150 88, 176 98, 180 118 C 184 138, 160 154, 120 154 C 80 154, 56 138, 60 118 C 64 98, 90 88, 120 88 Z";
const DOMES = [[90, 80], [150, 80]];

export const frog = {
  id: "frog",
  name: "Moss",
  species: "tree frog",
  role: "the zen philosopher: unbothered, observant, radiates chill vibes",
  defaultPalette: {
    skin_main: "#68C458",
    skin_belly: "#E9F8B5",
    cheeks: "#FFB8B8",
    eyes: "#FFD23F",
    accessory: "#2EB8A6",
    line: "#1E3B1C",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "frog" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const skin = pal.skin_main;
    const skinShadow = shadeColor(skin, -0.12);
    const belly = pal.skin_belly;
    const bellyShadow = shadeColor(belly, -0.1);
    const leaf = pal.accessory;
    const leafDark = shadeColor(leaf, -0.22);
    const line = pal.line;

    const basePivotY = view === "bust" ? 190 : 274;
    const rootTransform = tr(0, pose.bodyY, pose.bodyRot, pose.bodyScaleX, pose.bodyScaleY, 120, basePivotY);
    const ARM = { kind: "pads", color: skin, width: 10, line };

    // webbed foot: a heel with three toes ending in round pads
    const foot = (hx, hy, s) => {
      const toes = [[-16, 6], [-6, 9], [5, 8]].map(([dx, dy]) => [hx + s * dx, hy + dy]);
      const d = toes.map(([x, y]) => `M ${hx} ${hy} L ${x} ${y}`).join(" ");
      return `<path d="${d}" stroke="${line}" stroke-width="10" stroke-linecap="round"/>
        <path d="${d}" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
        ${toes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${skin}" stroke="${line}" stroke-width="2.4"/>`).join("")}`;
    };

    // 1. Body, legs, back arms
    const renderBodyAndLimbs = () => {
      const torsoTransform = tr(0, 0, 0, 1 + pose.breath, 1 - pose.breath * 0.5, 120, 195);

      if (view === "bust") {
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 88 150 C 78 164, 74 178, 72 192 L 168 192 C 166 178, 162 164, 152 150 Z" fill="${skin}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 100 160 C 96 172, 96 184, 98 192 L 142 192 C 144 184, 144 172, 140 160 Z" fill="${belly}"/>
        </g>`;
      }

      const leg = (d) => `<path d="${d}" fill="${skin}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>`;
      return `<g id="${uid}-full-body">
        <g id="${uid}-legs">
          ${foot(100, 266, -1)}
          ${foot(140, 266, 1)}
          ${leg("M 96 224 C 90 240, 90 256, 94 268 C 98 271, 106 271, 110 268 L 114 230 Z")}
          ${leg("M 144 224 C 150 240, 150 256, 146 268 C 142 271, 134 271, 130 268 L 126 230 Z")}
        </g>
        ${renderArms("frog", pose, ARM, "back", view, uid, 192, options.held)}
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 94 150 C 80 176, 78 214, 90 232 C 102 242, 138 242, 150 232 C 162 214, 160 176, 146 150 Z" fill="${skin}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 92 224 C 104 238, 136 238, 148 224 C 140 236, 130 240, 120 240 C 110 240, 100 236, 92 224 Z" fill="${skinShadow}"/>
          <ellipse cx="120" cy="200" rx="22" ry="28" fill="${belly}"/>
        </g>
      </g>`;
    };

    // 2. Teal water-lily leaf bandana, knotted on the viewer's left
    const renderScarf = () => {
      if (options.accessory === false) return "";
      const n = view === "bust" ? 151 : 149;
      return `<g id="${uid}-scarf"${tr(0, 0, pose.headRot * 0.25, 1, 1, 120, n)}>
        <path d="M 82 ${n} C 72 ${n - 9}, 62 ${n - 7}, 57 ${n - 2} C 64 ${n + 3}, 74 ${n + 5}, 82 ${n + 3} Z" fill="${leaf}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M 82 ${n + 4} C 72 ${n + 7}, 64 ${n + 15}, 62 ${n + 20} C 71 ${n + 18}, 79 ${n + 12}, 85 ${n + 6} Z" fill="${leafDark}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M 82 ${n - 3} C 100 ${n + 8}, 140 ${n + 8}, 158 ${n - 3} C 152 ${n + 14}, 135 ${n + 26}, 120 ${n + 33} C 105 ${n + 26}, 88 ${n + 14}, 82 ${n - 3} Z" fill="${leaf}" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M 120 ${n + 7} L 120 ${n + 29} M 120 ${n + 13} L 110 ${n + 9} M 120 ${n + 13} L 130 ${n + 9} M 120 ${n + 20} L 112 ${n + 16} M 120 ${n + 20} L 128 ${n + 16}" fill="none" stroke="${leafDark}" stroke-width="1.8" stroke-linecap="round"/>
      </g>`;
    };

    // 3. The wide frog mouth: its line is the edge of the pale jaw
    const renderMouth = () => {
      const open = clamp(pose.mouthOpen, 0, 1);
      const curve = clamp(pose.mouthCurve, -1, 1);
      const w = 40 * clamp(pose.mouthWidth, 0.5, 1.3);
      const yEnd = f(118 - curve * 3);
      const yMid = f(118 + curve * 16);
      const lineD = `M ${f(120 - w)} ${yEnd} Q 120 ${yMid} ${f(120 + w)} ${yEnd}`;
      let svg = "";
      if (clamp(pose.mouthO, 0, 1) > 0.35) {
        const ry = f(3.5 + open * 5);
        return `<ellipse cx="120" cy="${f(130 + open * 2)}" rx="5.5" ry="${ry}" fill="#5B222C" stroke="${line}" stroke-width="2.8"/>
          <ellipse cx="120" cy="${f(132 + open * 3)}" rx="3.4" ry="${f(Math.min(2.4, open * 3))}" fill="#F2828B"/>`;
      }
      if (open > 0.14) {
        const bot = f(118 + curve * 16 + 6 + open * 20);
        const d = `${lineD} C ${f(120 + w * 0.7)} ${bot}, ${f(120 - w * 0.7)} ${bot}, ${f(120 - w)} ${yEnd} Z`;
        const clip = `${uid}-frogmouth`;
        svg += `<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>
          <path d="${d}" fill="#5B222C"/>
          <ellipse cx="120" cy="${bot}" rx="${f(w * 0.55)}" ry="${f(6 + open * 6)}" fill="#F2828B" clip-path="url(#${clip})"/>
          <path d="${d}" fill="none" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>`;
      } else {
        svg += `<path d="${lineD}" fill="none" stroke="${line}" stroke-width="3.3" stroke-linecap="round"/>`;
      }
      if (pose.tongueOut > 0.15) {
        svg += `<g opacity="${f(clamp(pose.tongueOut, 0, 1))}" transform="translate(${f(120 + w * 0.42)} ${f(118 + curve * 9)}) rotate(-12)">
          <path d="M -5 0 C -5.5 7, -2.5 11, 0.5 11 C 4 11, 6 7, 5.2 0 Z" fill="#F27D88" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        </g>`;
      }
      return svg;
    };

    // 4. Tongue snapping at the fly (idle), and the fly itself
    const renderFly = () => {
      let svg = "";
      const k = clamp(pose.tongueFlick || 0, 0, 1);
      if (k > 0.02) {
        const x0 = 126, y0 = 121;
        const x1 = f(x0 + (pose.flyX - x0) * k), y1 = f(y0 + (pose.flyY - y0) * k);
        svg += `<path d="M ${x0} ${y0} L ${x1} ${y1}" stroke="${line}" stroke-width="8" stroke-linecap="round"/>
          <path d="M ${x0} ${y0} L ${x1} ${y1}" stroke="#F27D88" stroke-width="4.4" stroke-linecap="round"/>
          <circle cx="${x1}" cy="${y1}" r="4.6" fill="#F27D88" stroke="${line}" stroke-width="2.4"/>`;
      }
      const fly = clamp(pose.fly || 0, 0, 1);
      if (fly > 0.02) {
        const flap = f(2.2 + Math.abs(Math.sin(timeMs * 0.09)) * 2.4);
        svg += `<g opacity="${f(fly)}" transform="translate(${f(pose.flyX)} ${f(pose.flyY)}) scale(1.4)">
          <ellipse cx="-2.5" cy="-3" rx="2.6" ry="${flap}" fill="#EAF6FF" fill-opacity="0.85" stroke="${line}" stroke-width="1.2" transform="rotate(-25 -2.5 -3)"/>
          <ellipse cx="2.5" cy="-3" rx="2.6" ry="${flap}" fill="#EAF6FF" fill-opacity="0.85" stroke="${line}" stroke-width="1.2" transform="rotate(25 2.5 -3)"/>
          <ellipse cx="0" cy="0" rx="3.4" ry="2.7" fill="#2B2B30"/>
        </g>`;
      }
      return svg;
    };

    // 5. Head: eye domes on top, pale jaw, throat sac
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 148);
      const throat = clamp(pose.throat || 0, 0, 1.2);
      const clip = `${uid}-headclip`;
      // brows only appear when the face really uses them (the design's speaking / upset / sad)
      const browAmt = clamp((Math.abs(pose.browLRot) + Math.abs(pose.browRRot)) / 20 + Math.max(0, -(pose.browLY + pose.browRY) / 2) / 5, 0, 1);
      const shapes = `<path d="${HEAD}"/>${DOMES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="21"/>`).join("")}`;

      return `<g id="${uid}-head"${headTransform}>
        <!-- throat sac swelling under the chin -->
        <ellipse cx="120" cy="${f(146 + throat * 6)}" rx="${f(22 + throat * 12)}" ry="${f(6 + throat * 9)}" fill="${belly}" stroke="${line}" stroke-width="3.2"/>
        <g fill="${line}" stroke="${line}" stroke-width="7.2" stroke-linejoin="round">${shapes}</g>
        <g fill="${skin}">${shapes}</g>
        <defs><clipPath id="${clip}"><path d="${HEAD}"/></clipPath></defs>
        <g clip-path="url(#${clip})">
          <path d="M 54 112 C 80 121, 100 127, 120 127 C 140 127, 160 121, 186 112 L 186 160 L 54 160 Z" fill="${belly}"/>
          <path d="M 70 140 C 92 154, 148 154, 170 140 L 170 160 L 70 160 Z" fill="${bellyShadow}"/>
          <path d="M 54 112 C 80 121, 100 127, 120 127 C 140 127, 160 121, 186 112" fill="none" stroke="${skinShadow}" stroke-width="2.2"/>
        </g>

        ${renderCheekBlush(pose, { leftX: 78, rightX: 162, y: 112, rx: 10, ry: 6, color: pal.cheeks })}

        ${renderEyes(pose, {
          leftX: 90, rightX: 150, y: 80, rx: 15, ry: 15,
          irisColor: pal.eyes, pupilColor: "#1A1A12", lidColor: skin, lineColor: line,
          irisRatio: 0.9, pupilRatio: 0.55, heartColor: line, heartStroke: line,
        }, uid)}

        <g opacity="${f(browAmt)}">${renderBrows(pose, { leftX: 88, rightX: 152, y: 54, width: 16, thickness: 3.4, color: line })}</g>

        <g transform="translate(${f(pose.lookX * 3)} ${f(pose.lookY * 2)})">
          <ellipse cx="113" cy="104" rx="1.8" ry="1.4" fill="${line}"/>
          <ellipse cx="127" cy="104" rx="1.8" ry="1.4" fill="${line}"/>
          ${renderMouth()}
        </g>
        ${renderFly()}
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderBodyAndLimbs()}
        ${renderScarf()}
        ${renderArms("frog", pose, ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("frog", pose, ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
