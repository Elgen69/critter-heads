// Kona the Shiba Inu (id: "dog") — layered vector rig matching dog_turnaround.jpg & dog_expressions.jpg.

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
import { renderArms } from "../limbs.js";

const HEAD = "M 120 54 C 150 54, 170 70, 176 96 C 184 108, 185 128, 173 141 C 161 151, 142 155, 120 155 C 98 155, 79 151, 67 141 C 55 128, 56 108, 64 96 C 70 70, 90 54, 120 54 Z";

// mirror a path drawn for the viewer's-left ear onto the right side
const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${240 - Number(x)} ${y}`);

const EAR = "M 66 92 C 62 66, 68 40, 78 22 C 92 30, 104 46, 110 66 Z";
const EAR_TIP = "M 70 44 C 72 34, 74 28, 78 22 C 84 26, 90 31, 95 38 Q 82 38 70 44 Z";
const EAR_INNER = "M 75 82 C 72 64, 75 48, 80 36 C 88 43, 96 53, 101 67 Z";

export const dog = {
  id: "dog",
  name: "Kona",
  species: "shiba inu",
  role: "the cheerleader: loyal, eager, hypes the whole team up",
  defaultPalette: {
    fur_main: "#E5984A",
    fur_light: "#FFF7EB",
    fur_dark: "#44342A",
    eyes: "#3A2A20",
    tongue: "#F28C96",
    accessory: "#D94238",
    line: "#2C221C",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "dog" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furShadow = shadeColor(furMain, -0.12);
    const furLight = pal.fur_light;
    const furLightShadow = shadeColor(furLight, -0.08);
    const furDark = pal.fur_dark;
    const red = pal.accessory;
    const redDark = shadeColor(red, -0.22);
    const line = pal.line;

    const basePivotY = view === "bust" ? 190 : 274;
    const rootTransform = tr(0, pose.bodyY, pose.bodyRot, pose.bodyScaleX, pose.bodyScaleY, 120, basePivotY);
    const ARM = { kind: "paw", color: furMain, pawColor: furMain, pawR: 7.5, width: 13, line };

    // 1. Curled shiba tail peeking past the right hip (full view)
    const renderTail = () => {
      if (view === "bust") return "";
      const puff = 1 + (pose.tailPuff || 0) * 0.2;
      return `<g id="${uid}-tail"${tr(0, 0, pose.tailRot * 0.6, puff, puff, 150, 226)}>
        <path d="M 146 228 C 150 210, 160 196, 176 198 C 190 200, 193 222, 181 232 C 170 241, 154 238, 146 228 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 177 204 C 187 209, 189 223, 181 231 C 175 236, 164 236, 157 231 C 168 229, 179 221, 177 204 Z" fill="${furLight}"/>
        <path d="M 168 223 C 160 220, 162 208, 172 210 C 178 212, 178 220, 172 224" fill="none" stroke="${line}" stroke-width="2.6" stroke-linecap="round"/>
      </g>`;
    };

    // 2. Body, legs, back arms
    const renderBodyAndLimbs = () => {
      const torsoTransform = tr(0, 0, 0, 1 + pose.breath, 1 - pose.breath * 0.5, 120, 195);

      if (view === "bust") {
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 86 150 C 78 164, 74 178, 72 192 L 168 192 C 166 178, 162 164, 154 150 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 100 156 C 96 170, 96 184, 98 192 L 142 192 C 144 184, 144 170, 140 156 Z" fill="${furLight}"/>
        </g>`;
      }

      const leg = (d, toes) => `<path d="${d}" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="${toes}" fill="none" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>`;
      return `<g id="${uid}-full-body">
        <g id="${uid}-legs">
          ${leg("M 92 222 C 88 238, 88 254, 90 266 C 83 268, 82 277, 90 277 L 108 277 C 113 277, 113 270, 110 266 L 112 228 Z", "M 96 271 L 96 277 M 103 271 L 103 277")}
          ${leg(mirror("M 92 222 C 88 238, 88 254, 90 266 C 83 268, 82 277, 90 277 L 108 277 C 113 277, 113 270, 110 266 L 112 228 Z"), "M 144 271 L 144 277 M 137 271 L 137 277")}
        </g>
        ${renderArms("dog", pose, ARM, "back", view, uid, 192, options.held)}
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 92 152 C 80 176, 78 214, 90 234 C 102 244, 138 244, 150 234 C 162 214, 160 176, 148 152 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 92 226 C 104 240, 136 240, 148 226 C 140 238, 130 242, 120 242 C 110 242, 100 238, 92 226 Z" fill="${furShadow}"/>
          <!-- cream belly and chest bib -->
          <path d="M 102 170 C 94 186, 94 218, 104 230 C 112 236, 128 236, 136 230 C 146 218, 146 186, 138 170 C 130 162, 110 162, 102 170 Z" fill="${furLight}"/>
        </g>
      </g>`;
    };

    // 3. Red triangle bandanna, knotted on the viewer's right
    const renderBandanna = () => {
      if (options.accessory === false) return "";
      const n = view === "bust" ? 150 : 149;
      return `<g id="${uid}-bandanna"${tr(0, 0, pose.headRot * 0.25, 1, 1, 120, n)}>
        <path d="M 82 ${n + 2} C 102 ${n + 10}, 138 ${n + 10}, 158 ${n + 2} C 148 ${n + 18}, 133 ${n + 32}, 122 ${n + 40} C 120 ${n + 41.5}, 118 ${n + 41}, 116.5 ${n + 39.5} C 106 ${n + 30}, 92 ${n + 18}, 82 ${n + 2} Z" fill="${red}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M 98 ${n + 12} C 108 ${n + 21}, 115 ${n + 29}, 119 ${n + 36}" fill="none" stroke="${redDark}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M 80 ${n - 4} C 96 ${n + 6}, 144 ${n + 6}, 160 ${n - 4} L 161 ${n + 4} C 144 ${n + 13}, 96 ${n + 13}, 79 ${n + 4} Z" fill="${red}" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M 166 ${n - 1} L 180 ${n - 8} L 177 ${n + 3} Z" fill="${red}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M 166 ${n + 3} L 178 ${n + 13} L 167 ${n + 12} Z" fill="${redDark}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="164" cy="${n + 1}" r="5.2" fill="${red}" stroke="${line}" stroke-width="2.8"/>
      </g>`;
    };

    // 4. Head: perky ears, cream urajiro cheeks, eyebrow dots
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      // flattened ears swing out sideways ("airplane ears" in the design's upset / sad / sleeping)
      const earL = f(pose.earLRot - pose.earFlatten * 78);
      const earR = f(pose.earRRot + pose.earFlatten * 78);
      const earSY = f(1 - pose.earFlatten * 0.2);
      const ear = (side, rot, px) => `<g id="${uid}-ear${side}"${tr(0, 0, rot, 1, earSY, px, 74)}>
          <path d="${side === "L" ? EAR : mirror(EAR)}" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="${side === "L" ? EAR_INNER : mirror(EAR_INNER)}" fill="${furLight}"/>
          <path d="${side === "L" ? EAR_TIP : mirror(EAR_TIP)}" fill="${furDark}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
        </g>`;
      const tw = pose.noseTwitch || 0;
      const clip = `${uid}-headclip`;

      return `<g id="${uid}-head"${headTransform}>
        ${ear("L", earL, 88)}
        ${ear("R", earR, 152)}
        <defs><clipPath id="${clip}"><path d="${HEAD}"/></clipPath></defs>
        <path d="${HEAD}" fill="${furMain}"/>
        <g clip-path="url(#${clip})">
          <path d="M 50 118 C 64 110, 86 110, 103 116 C 108 105, 132 105, 137 116 C 154 110, 176 110, 190 118 L 190 160 L 50 160 Z" fill="${furLight}"/>
          <path d="M 70 140 C 92 154, 148 154, 170 140 L 170 160 L 70 160 Z" fill="${furLightShadow}"/>
        </g>
        <path d="${HEAD}" fill="none" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>

        ${renderCheekBlush(pose, { leftX: 80, rightX: 160, y: 125, rx: 11, ry: 6, color: "#F4A0A8" })}

        ${renderEyes(pose, {
          leftX: 95, rightX: 145, y: 102, rx: 13, ry: 13.5,
          irisColor: pal.eyes, pupilColor: "#160F0B", lidColor: furMain, lineColor: line,
          irisRatio: 0.86, pupilRatio: 0.55, heartColor: "#F26B8A",
        }, uid)}

        <!-- the shiba's cream eyebrow dots double as brows -->
        ${renderBrows(pose, { leftX: 98, rightX: 142, y: 80, width: 12, thickness: 4.4, color: furLight, style: "bean" })}

        <g transform="translate(${f(pose.lookX * 3)} ${f(pose.lookY * 2)})">
          ${renderMouth(pose, { cx: 120, cy: 133, width: 24, lineColor: line, splitSmile: true, noseBottomY: 125 }, uid)}
          <g${tr(0, tw * 0.8, 0, 1 + Math.abs(tw) * 0.06, 1, 120, 118)}>
            <path d="M 110 116 C 110 111, 130 111, 130 116 C 130 122, 124 126, 120 126 C 116 126, 110 122, 110 116 Z" fill="${furDark}" stroke="${line}" stroke-width="2.6"/>
            <ellipse cx="116.5" cy="115.5" rx="3" ry="1.4" fill="#FFFFFF" fill-opacity="0.5"/>
          </g>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderTail()}
        ${renderBodyAndLimbs()}
        ${renderBandanna()}
        ${renderArms("dog", pose, ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("dog", pose, ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
