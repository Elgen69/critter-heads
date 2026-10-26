// Barnaby the Brown Bear (id: "bear") — layered vector rig matching bear_turnaround.jpg & bear_expressions.jpg.

import {
  f,
  tr,
  shadeColor,
  renderShadow,
  renderLoveHearts,
  renderCheekBlush,
  renderEyes,
  renderBrows,
  renderMouth,
} from "../parts.js";
import { clamp } from "../rig.js";
import { renderArms } from "../limbs.js";

const HEAD = "M 120 52 C 150 52, 170 68, 176 92 C 180 104, 180 116, 178 124 L 186 130 L 177 134 L 182 141 L 171 142 C 160 152, 142 156, 120 156 C 98 156, 80 152, 69 142 L 58 141 L 63 134 L 54 130 L 62 124 C 60 116, 60 104, 64 92 C 70 68, 90 52, 120 52 Z";

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

export const bear = {
  id: "bear",
  name: "Barnaby",
  species: "brown bear",
  role: "the gentle giant: warm, patient, keeper of snacks and tea",
  defaultPalette: {
    fur_main: "#7D533A",
    fur_light: "#E8D3B8",
    nose: "#2B1D16",
    eyes: "#2B1D16",
    accessory: "#D99B26",
    line: "#2B1D16",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "bear" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furShadow = shadeColor(furMain, -0.14);
    const furLight = pal.fur_light;
    const vest = pal.accessory;
    const vestDark = shadeColor(vest, -0.2);
    const line = pal.line;

    const basePivotY = view === "bust" ? 190 : 274;
    const rootTransform = tr(0, pose.bodyY, pose.bodyRot, pose.bodyScaleX, pose.bodyScaleY, 120, basePivotY);
    const ARM = { kind: "paw", color: furMain, pawColor: furMain, pawR: 9, width: 17, line };

    // ribbed V-neck collar (top y of the V arms, bottom of the V)
    const collar = (top, bottom) => {
      const pts = [];
      for (let i = 1; i < 7; i++) {
        const k = i / 7;
        for (const s of [-1, 1]) {
          const x = 120 + s * 22 * (1 - k), y = top + (bottom - top) * k;
          pts.push(`M ${f(x - s * 2.6)} ${f(y - 2)} L ${f(x + s * 2.6)} ${f(y + 2)}`);
        }
      }
      const v = `M 96 ${top - 2} L 120 ${bottom} L 144 ${top - 2}`;
      return `<path d="M 98 ${top} L 120 ${bottom - 4} L 142 ${top} Z" fill="${furLight}"/>
        <path d="${v}" fill="none" stroke="${line}" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${v}" fill="none" stroke="${vestDark}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${pts.join(" ")}" stroke="${shadeColor(vest, -0.38)}" stroke-width="1.4" stroke-linecap="round"/>`;
    };

    // 1. Body (heavy pear torso, vest, honey belly), legs, back arms
    const renderBodyAndLimbs = () => {
      const torsoTransform = tr(0, 0, 0, 1 + pose.breath, 1 - pose.breath * 0.5, 120, 198);

      if (view === "bust") {
        if (options.accessory === false) {
          return `<g id="${uid}-bust-body"${torsoTransform}>
            <path d="M 80 148 C 62 160, 52 176, 48 192 L 192 192 C 188 176, 178 160, 160 148 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
            <path d="M 98 158 C 92 170, 92 184, 94 192 L 146 192 C 148 184, 148 170, 142 158 Z" fill="${furLight}"/>
          </g>`;
        }
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 80 148 C 62 160, 52 176, 48 192 L 192 192 C 188 176, 178 160, 160 148 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 76 156 C 70 166, 66 180, 66 192 L 174 192 C 174 180, 170 166, 164 156 C 150 151, 106 151, 76 156 Z" fill="${vest}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          ${collar(152, 180)}
        </g>`;
      }

      const leg = (d) => `<path d="${d}" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>`;
      return `<g id="${uid}-full-body">
        <g id="${uid}-legs">
          ${leg("M 88 232 C 84 248, 84 260, 86 268 C 79 270, 79 278, 88 278 L 112 278 C 117 278, 117 271, 114 267 L 116 238 Z")}
          ${leg("M 152 232 C 156 248, 156 260, 154 268 C 161 270, 161 278, 152 278 L 128 278 C 123 278, 123 271, 126 267 L 124 238 Z")}
          <path d="M 94 272 L 94 278 M 102 272 L 102 278 M 146 272 L 146 278 M 138 272 L 138 278" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        ${renderArms("bear", pose, ARM, "back", view, uid, 192, options.held)}
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 86 150 C 68 176, 64 222, 80 240 C 94 252, 146 252, 160 240 C 176 222, 172 176, 154 150 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 82 232 C 96 248, 144 248, 158 232 C 148 247, 134 251, 120 251 C 106 251, 92 247, 82 232 Z" fill="${furShadow}"/>
          <ellipse cx="120" cy="222" rx="27" ry="19" fill="${furLight}"/>
          ${options.accessory === false ? `<path d="M 100 160 C 94 172, 94 190, 98 200 L 142 200 C 146 190, 146 172, 140 160 Z" fill="${furLight}"/>` : `
          <path d="M 86 154 C 76 170, 74 192, 77 210 C 98 217, 142 217, 163 210 C 166 192, 164 170, 154 154 C 140 150, 100 150, 86 154 Z" fill="${vest}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <path d="M 80 205 C 100 212, 140 212, 160 205" fill="none" stroke="${vestDark}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1.5 4"/>
          ${collar(152, 182)}`}
        </g>
      </g>`;
    };

    // 2. Head: round cup ears, fluffy cheek tufts, big honey muzzle, bead eyes
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      const flat = pose.earFlatten;
      const ear = (cx, s) => `<g${tr(s * flat * 6, flat * 10, f((s < 0 ? pose.earLRot : pose.earRRot) * 0.5 + s * flat * 40), 1, 1, 120 + s * 30, 76)}>
          <circle cx="${cx}" cy="62" r="17" fill="${furMain}" stroke="${line}" stroke-width="3.6"/>
          <circle cx="${cx - s * 3}" cy="65" r="9.5" fill="${furLight}"/>
        </g>`;

      // bead eyes that open up into whites when surprised
      const wide = clamp((pose.eyeScale - 1.06) / 0.14, 0, 1);
      const tw = pose.noseTwitch || 0;

      return `<g id="${uid}-head"${headTransform}>
        ${ear(74, -1)}
        ${ear(166, 1)}
        <path d="${HEAD}" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 108 55 C 110 46, 116 44, 118 50 C 121 43, 128 44, 128 52 C 132 48, 137 50, 136 56" fill="${furMain}" stroke="${line}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 72 140 C 92 154, 148 154, 168 140 C 156 152, 140 155, 120 155 C 100 155, 84 152, 72 140 Z" fill="${furShadow}"/>

        ${renderCheekBlush(pose, { leftX: 80, rightX: 160, y: 126, rx: 12, ry: 6.5, color: "#E86F78" })}

        ${renderEyes(pose, {
          leftX: 99, rightX: 141, y: 99, rx: 8.5, ry: 9.5,
          scleraColor: mixHex(pal.eyes, "#FFFFFF", wide), irisColor: pal.eyes, pupilColor: pal.eyes,
          lidColor: furMain, lineColor: line, irisRatio: 1 - wide * 0.4, pupilRatio: 0.6, heartColor: "#F26B8A",
          outline: wide > 0.3,
        }, uid)}

        ${renderBrows(pose, { leftX: 97, rightX: 143, y: 82, width: 15, thickness: 2.6, color: shadeColor(furMain, -0.38), style: "arch" })}

        <g transform="translate(${f(pose.lookX * 3)} ${f(pose.lookY * 2)})">
          <ellipse cx="120" cy="125" rx="27" ry="22" fill="${furLight}" stroke="${line}" stroke-width="3.2"/>
          ${renderMouth(pose, { cx: 120, cy: 135, width: 22, lineColor: line, splitSmile: true, noseBottomY: 123 }, uid)}
          <g${tr(0, tw * 0.8, 0, 1 + Math.abs(tw) * 0.05, 1, 120, 115)}>
            <path d="M 109 113 C 109 107, 131 107, 131 113 C 131 119, 125 123, 120 123 C 115 123, 109 119, 109 113 Z" fill="${pal.nose}" stroke="${line}" stroke-width="2.6"/>
            <ellipse cx="115.5" cy="111" rx="3.6" ry="1.6" fill="#FFFFFF" fill-opacity="0.4"/>
          </g>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderBodyAndLimbs()}
        ${renderArms("bear", pose, ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("bear", pose, ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
