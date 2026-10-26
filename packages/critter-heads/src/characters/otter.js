// Ollie the River Otter (id: "otter") — layered vector rig matching otter_turnaround.jpg & otter_expressions.jpg.

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

const HEAD = "M 120 58 C 152 58, 172 76, 174 102 C 176 124, 166 142, 148 148 C 138 151, 130 152, 120 152 C 110 152, 102 151, 92 148 C 74 142, 64 124, 66 102 C 68 76, 88 58, 120 58 Z";

export const otter = {
  id: "otter",
  name: "Ollie",
  species: "river otter",
  role: "the tinkerer: playful, tactile, keeps a lucky shiny stone",
  defaultPalette: {
    fur_main: "#6B4E3D",
    fur_light: "#F2E4D0",
    nose: "#2E2018",
    eyes: "#3BB8D8",
    accessory: "#49C6B8",
    line: "#261B14",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "otter" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furShadow = shadeColor(furMain, -0.16);
    const furLight = pal.fur_light;
    const furLightShadow = shadeColor(furLight, -0.08);
    const stone = pal.accessory;
    const line = pal.line;

    const basePivotY = view === "bust" ? 190 : 274;
    const rootTransform = tr(0, pose.bodyY, pose.bodyRot, pose.bodyScaleX, pose.bodyScaleY, 120, basePivotY);
    const ARM = { kind: "paw", color: furMain, pawColor: furMain, pawR: 6.5, width: 11, line };

    // 1. Long tapered rudder tail lying out to the viewer's right (full view)
    const renderTail = () => {
      if (view === "bust") return "";
      const puff = 1 + (pose.tailPuff || 0) * 0.15;
      return `<g id="${uid}-tail"${tr(0, 0, pose.tailRot * 0.35, puff, puff, 138, 236)}>
        <path d="M 134 224 C 150 240, 170 252, 204 258 C 209 259, 209 264, 202 265 C 176 268, 150 260, 130 242 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 140 246 C 160 258, 182 263, 202 263" fill="none" stroke="${furShadow}" stroke-width="2.4" stroke-linecap="round"/>
      </g>`;
    };

    // 2. Sleek long body with the cream throat bib, legs, back arms
    const renderBodyAndLimbs = () => {
      const torsoTransform = tr(0, 0, 0, 1 + pose.breath, 1 - pose.breath * 0.5, 120, 195);

      if (view === "bust") {
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 88 144 C 84 162, 80 178, 78 192 L 162 192 C 160 178, 156 162, 152 144 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 101 144 C 99 162, 99 178, 101 192 L 139 192 C 141 178, 141 162, 139 144 Z" fill="${furLight}"/>
        </g>`;
      }

      const leg = (d) => `<path d="${d}" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>`;
      return `<g id="${uid}-full-body">
        <g id="${uid}-legs">
          ${leg("M 98 228 C 95 242, 95 256, 97 266 C 89 268, 88 277, 96 277 L 112 277 C 116 277, 116 270, 113 266 L 116 232 Z")}
          ${leg("M 142 228 C 145 242, 145 256, 143 266 C 151 268, 152 277, 144 277 L 128 277 C 124 277, 124 270, 127 266 L 124 232 Z")}
          <path d="M 101 271 L 101 277 M 107 271 L 107 277 M 139 271 L 139 277 M 133 271 L 133 277" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>
        </g>
        ${renderArms("otter", pose, ARM, "back", view, uid, 192, options.held)}
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 97 144 C 88 168, 85 206, 92 230 C 100 244, 140 244, 148 230 C 155 206, 152 168, 143 144 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 94 222 C 104 238, 136 238, 146 222 C 140 236, 130 240, 120 240 C 110 240, 100 236, 94 222 Z" fill="${furShadow}"/>
          <path d="M 102 146 C 103 166, 108 186, 113 196 L 117 192 L 120 200 L 123 192 L 127 196 C 132 186, 137 166, 138 146 Z" fill="${furLight}"/>
        </g>
      </g>`;
    };

    // 3. Lucky turquoise pebble on a leather cord
    const renderPendant = () => {
      if (options.accessory === false) return "";
      const swing = f(pose.headRot * 0.2 + pose.bodyRot * 0.4);
      return `<g id="${uid}-pendant">
        <path d="M 96 146 C 101 162, 111 171, 120 173 C 129 171, 139 162, 144 146" fill="none" stroke="${line}" stroke-width="2.6" stroke-linecap="round"/>
        <g transform="rotate(${swing} 120 172)">
          <ellipse cx="120" cy="180" rx="6.5" ry="8" fill="${stone}" stroke="${line}" stroke-width="2.8"/>
          <ellipse cx="117.8" cy="176.5" rx="2" ry="3" fill="#FFFFFF" fill-opacity="0.55" transform="rotate(-18 117.8 176.5)"/>
        </g>
      </g>`;
    };

    // 4. Head: flat broad head, small ears at the top corners, cream muzzle, whisker dots + whiskers
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      const flat = pose.earFlatten;
      const ear = (cx, s) => `<g${tr(0, flat * 4, f(s * flat * 24 + (s < 0 ? pose.earLRot : pose.earRRot) * 0.4), 1, 1, cx + s * -6, 78)}>
          <circle cx="${cx}" cy="74" r="10.5" fill="${furMain}" stroke="${line}" stroke-width="3.4"/>
          <circle cx="${cx - s * 1.5}" cy="75" r="5" fill="${furShadow}"/>
        </g>`;
      const tw = pose.noseTwitch || 0;
      const clip = `${uid}-headclip`;
      // fine whiskers that stay mostly inside the face, like the design
      const whiskers = (s) => {
        const ox = 120 + s * 30;
        const d = [[-6, 22], [0, 25], [6, 22]].map(([dy, len]) => `M ${ox} ${128 + dy * 0.5} L ${ox + s * len} ${128 + dy * 1.4}`).join(" ");
        return `<g${tr(0, 0, f(s * tw * 4), 1, 1, ox, 128)}>
          <path d="${d}" stroke="${line}" stroke-opacity="0.25" stroke-width="2.4" stroke-linecap="round"/>
          <path d="${d}" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
        </g>`;
      };

      return `<g id="${uid}-head"${headTransform}>
        ${ear(78, -1)}
        ${ear(162, 1)}
        <defs><clipPath id="${clip}"><path d="${HEAD}"/></clipPath></defs>
        <path d="${HEAD}" fill="${furMain}"/>
        <g clip-path="url(#${clip})">
          <path d="M 56 116 C 66 110, 80 108, 92 113 C 100 105, 112 103, 120 107 C 128 103, 140 105, 148 113 C 160 108, 174 110, 184 116 L 184 160 L 56 160 Z" fill="${furLight}"/>
          <path d="M 74 138 C 94 152, 146 152, 166 138 L 166 160 L 74 160 Z" fill="${furLightShadow}"/>
        </g>
        <path d="${HEAD}" fill="none" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        ${whiskers(-1)}
        ${whiskers(1)}

        ${renderCheekBlush(pose, { leftX: 84, rightX: 156, y: 124, rx: 10, ry: 5.5, color: "#F08A90" })}

        ${renderEyes(pose, {
          leftX: 97, rightX: 143, y: 102, rx: 13.5, ry: 14,
          irisColor: pal.eyes, pupilColor: "#101A1E", lidColor: furMain, lineColor: line,
          irisRatio: 0.82, pupilRatio: 0.56, heartColor: "#F26B8A",
        }, uid)}

        ${renderBrows(pose, { leftX: 96, rightX: 144, y: 83, width: 14, thickness: 2.8, color: shadeColor(furMain, -0.4) })}

        <g transform="translate(${f(pose.lookX * 3)} ${f(pose.lookY * 2)})">
          <g fill="${shadeColor(furMain, 0.1)}">
            <circle cx="91" cy="125" r="1.7"/><circle cx="87" cy="131" r="1.7"/><circle cx="95" cy="131" r="1.7"/>
            <circle cx="149" cy="125" r="1.7"/><circle cx="153" cy="131" r="1.7"/><circle cx="145" cy="131" r="1.7"/>
          </g>
          ${renderMouth(pose, { cx: 120, cy: 135, width: 26, lineColor: line, splitSmile: true, noseBottomY: 128 }, uid)}
          <!-- big rounded otter nose -->
          <g${tr(0, tw * 0.9, 0, 1 + Math.abs(tw) * 0.05, 1, 120, 117)}>
            <path d="M 105 115 C 105 107, 135 107, 135 115 C 135 123, 127 128.5, 120 128.5 C 113 128.5, 105 123, 105 115 Z" fill="${pal.nose}" stroke="${line}" stroke-width="2.8"/>
            <ellipse cx="113.5" cy="112" rx="4.2" ry="1.8" fill="#FFFFFF" fill-opacity="0.4"/>
          </g>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderTail()}
        ${renderBodyAndLimbs()}
        ${renderPendant()}
        ${renderArms("otter", pose, ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("otter", pose, ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
