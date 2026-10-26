// Pippin the Cream Rabbit (id: "bunny") — layered vector rig matching bunny_turnaround.jpg & bunny_expressions.jpg.

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

const HEAD = "M 120 66 C 148 66, 166 84, 170 106 C 176 116, 178 132, 168 142 C 158 151, 140 154, 120 154 C 100 154, 82 151, 72 142 C 62 132, 64 116, 70 106 C 74 84, 92 66, 120 66 Z";

// One ear (viewer's left, pointing up), split at the middle so the tip can fold over.
const EAR_LOW = "M 90 80 C 88 66, 88 52, 90 42 L 112 42 C 114 52, 113 66, 111 80 Z";
const EAR_TIP = "M 90 44 C 89 28, 93 12, 101 8 C 109 12, 113 28, 112 44 Z";
const PINK_LOW = "M 95 76 C 94 64, 94 52, 95 42 L 107 42 C 108 52, 107 64, 106 76 Z";
const PINK_TIP = "M 95 44 C 95 32, 97 20, 101 16 C 105 20, 107 32, 107 44 Z";
const EAR_BASE = [101, 78];
const EAR_JOINT = [101, 43];

export const bunny = {
  id: "bunny",
  name: "Pippin",
  species: "cream rabbit",
  role: "the speedrunner: hyperactive, three steps ahead, ideas before coffee",
  defaultPalette: {
    fur_main: "#F7F2E9",
    fur_inner_ear_and_nose: "#F6B2C0",
    fur_cheeks: "#FAD3DC",
    eyes: "#8A5BEB",
    accessory: "#FFC93C",
    line: "#2D262B",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "bunny" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furShadow = shadeColor(furMain, -0.08);
    const belly = shadeColor(furMain, 0.6);
    const pink = pal.fur_inner_ear_and_nose;
    const bow = pal.accessory;
    const bowDark = shadeColor(bow, -0.22);
    const line = pal.line;

    const basePivotY = view === "bust" ? 190 : 274;
    const rootTransform = tr(0, pose.bodyY, pose.bodyRot, pose.bodyScaleX, pose.bodyScaleY, 120, basePivotY);
    const ARM = { kind: "paw", color: furMain, pawColor: furMain, pawR: 7, width: 12, line };

    // 1. Pom-pom tail peeking past the right hip (full view)
    const renderTail = () => {
      if (view === "bust") return "";
      const puffs = [[0, -9], [8, -5], [9, 4], [2, 10], [-7, 7], [-8, -2], [0, 0]];
      const puff = 1 + (pose.tailPuff || 0) * 0.25;
      return `<g id="${uid}-tail"${tr(0, 0, pose.tailRot * 0.4, puff, puff, 152, 226)}>
        ${puffs.map(([x, y]) => `<circle cx="${156 + x}" cy="${226 + y}" r="7" fill="${line}" stroke="${line}" stroke-width="7"/>`).join("")}
        ${puffs.map(([x, y]) => `<circle cx="${156 + x}" cy="${226 + y}" r="7" fill="${furMain}"/>`).join("")}
      </g>`;
    };

    // 2. Body, long feet, back arms
    const renderBodyAndLimbs = () => {
      const torsoTransform = tr(0, 0, 0, 1 + pose.breath, 1 - pose.breath * 0.5, 120, 195);

      if (view === "bust") {
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 90 152 C 82 166, 78 180, 76 192 L 164 192 C 162 180, 158 166, 150 152 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 102 162 C 98 172, 98 184, 100 192 L 140 192 C 142 184, 142 172, 138 162 Z" fill="${belly}"/>
        </g>`;
      }

      return `<g id="${uid}-full-body">
        <g id="${uid}-legs">
          <path d="M 96 224 C 92 240, 92 254, 94 264 C 84 266, 79 277, 90 277 L 112 277 C 116 277, 116 270, 112 264 L 114 228 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 144 224 C 148 240, 148 254, 146 264 C 156 266, 161 277, 150 277 L 128 277 C 124 277, 124 270, 128 264 L 126 228 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 94 271 L 94 277 M 101 271 L 101 277 M 146 271 L 146 277 M 139 271 L 139 277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        ${renderArms("bunny", pose, ARM, "back", view, uid, 192, options.held)}
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 96 154 C 84 178, 82 214, 94 234 C 104 244, 136 244, 146 234 C 158 214, 156 178, 144 154 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 96 228 C 106 240, 134 240, 144 228 C 136 238, 128 241, 120 241 C 112 241, 104 238, 96 228 Z" fill="${furShadow}"/>
          <ellipse cx="120" cy="206" rx="19" ry="24" fill="${belly}"/>
        </g>
      </g>`;
    };

    // 3. Marigold bow tie
    const renderBowTie = () => {
      if (options.accessory === false) return "";
      const n = view === "bust" ? 156 : 155;
      const loop = "M -5 -3 C -12 -10, -22 -12, -24 -4 C -26 3, -22 11, -14 9 C -10 8, -7 5, -5 3 Z";
      return `<g id="${uid}-bowtie" transform="translate(120 ${n}) rotate(${f(pose.headRot * 0.3)})">
        <path d="${loop}" fill="${bow}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
        <path d="${loop}" transform="scale(-1 1)" fill="${bow}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M -8 -2 C -13 -4, -17 -4, -20 -2 M -8 2 C -12 4, -16 5, -20 4 M 8 -2 C 13 -4, 17 -4, 20 -2 M 8 2 C 12 4, 16 5, 20 4" fill="none" stroke="${bowDark}" stroke-width="2" stroke-linecap="round"/>
        <rect x="-5.5" y="-6" width="11" height="12" rx="4" fill="${bow}" stroke="${line}" stroke-width="3"/>
      </g>`;
    };

    // 4. Ears: each is drawn twice (outline pass, then fill pass) so the two segments read as one
    // ear; the tip segment folds at the joint with earLFlop / earRFlop.
    const earAngle = (side) => (side === "L" ? -8 + pose.earLRot : 8 + pose.earRRot);
    const renderEar = (side) => {
      const flop = side === "L" ? pose.earLFlop || 0 : pose.earRFlop || 0;
      const sx = side === "L" ? 1 : -1;
      const flip = side === "L" ? "" : ` transform="translate(240 0) scale(-1 1)"`;
      // in the mirrored right ear a negative fold still swings the tip outward
      const tipRot = f(-flop * 120);
      const tip = (d, extra) => `<path d="${d}"${tr(0, 0, tipRot, 1, 1, EAR_JOINT[0], EAR_JOINT[1])} ${extra}/>`;
      const low = (d, extra) => `<path d="${d}" ${extra}/>`;
      const outline = `fill="${line}" stroke="${line}" stroke-width="7.2" stroke-linejoin="round"`;
      const angle = earAngle(side) * sx;
      // swung-down ears slide their root out to the side of the head so they hang past the cheeks
      const out = Math.min(1, Math.max(0, (Math.abs(angle) - 60) / 80));
      return `<g id="${uid}-ear${side}"${flip}><g transform="translate(${f(-out * 30)} ${f(out * 12)})"><g${tr(0, 0, f(angle), 1, 1, EAR_BASE[0], EAR_BASE[1])}>
        ${low(EAR_LOW, outline)}${tip(EAR_TIP, outline)}
        ${low(EAR_LOW, `fill="${furMain}"`)}${tip(EAR_TIP, `fill="${furMain}"`)}
        ${low(PINK_LOW, `fill="${pink}"`)}${tip(PINK_TIP, `fill="${pink}"`)}
      </g></g></g>`;
    };

    // 5. Head & face
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 148);
      // hanging ears (sad, sleeping) drape in front of the cheeks, like the design
      const front = (side) => Math.abs(earAngle(side)) > 100;
      const tw = pose.noseTwitch || 0;

      return `<g id="${uid}-head"${headTransform}>
        ${front("L") ? "" : renderEar("L")}
        ${front("R") ? "" : renderEar("R")}
        <path d="${HEAD}" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 74 138 C 92 152, 148 152, 166 138 C 154 150, 138 153, 120 153 C 102 153, 86 150, 74 138 Z" fill="${furShadow}"/>
        <path d="M 109 70 C 110 62, 115 60, 118 65 C 120 58, 126 58, 126 65 C 129 61, 134 63, 132 70" fill="${furMain}" stroke="${line}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

        ${renderCheekBlush(pose, { leftX: 82, rightX: 158, y: 127, rx: 12, ry: 7, color: shadeColor(pal.fur_cheeks, -0.12) })}

        ${renderEyes(pose, {
          leftX: 97, rightX: 143, y: 110, rx: 14, ry: 14.5,
          irisColor: pal.eyes, pupilColor: "#24133F", lidColor: furMain, lineColor: line,
          irisRatio: 0.84, pupilRatio: 0.5, heartColor: pal.eyes,
        }, uid)}

        ${renderBrows(pose, { leftX: 95, rightX: 145, y: 88, width: 13, thickness: 2.8, color: shadeColor(line, 0.45) })}

        <g transform="translate(${f(pose.lookX * 2.8)} ${f(pose.lookY * 1.8)})">
          ${renderMouth(pose, { cx: 120, cy: 133, width: 18, lineColor: line, splitSmile: true, noseBottomY: 126.5 }, uid)}
          <!-- tiny pink heart nose, twitching -->
          <path d="M 120 126.5 C 114.5 123, 113.5 118.5, 117 117.6 C 118.6 117.2, 120 118.4, 120 120 C 120 118.4, 121.4 117.2, 123 117.6 C 126.5 118.5, 125.5 123, 120 126.5 Z"${tr(0, tw * 1.1, 0, 1 + Math.abs(tw) * 0.1, 1 - Math.abs(tw) * 0.06, 120, 122)} fill="${pink}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>
        </g>
        ${front("L") ? renderEar("L") : ""}
        ${front("R") ? renderEar("R") : ""}
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderTail()}
        ${renderBodyAndLimbs()}
        ${renderBowTie()}
        ${renderArms("bunny", pose, ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("bunny", pose, ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
