// Hoot the Horned Owl (id: "owl") — layered vector rig matching owl_turnaround.jpg & owl_expressions.jpg.

import {
  f,
  tr,
  shadeColor,
  renderShadow,
  renderLoveHearts,
  renderCheekBlush,
  renderEyes,
  renderBrows,
  renderOwlBeak,
} from "../parts.js";
import { clamp } from "../rig.js";
import { renderArms } from "../limbs.js";

export const owl = {
  id: "owl",
  name: "Hoot",
  species: "horned owl",
  role: "the skeptic: the thinker who asks hard questions",
  defaultPalette: {
    feathers_main: "#7A5C46",
    feathers_light_face_disc: "#F3E3C8",
    chest_speckles: "#5A4232",
    eyes: "#F5B700",
    beak: "#E0A23B",
    accessory: "#3B5BA5",
    line: "#2E241D",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "owl" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const main = pal.feathers_main;
    const mainShadow = shadeColor(main, -0.15);
    const mainLight = shadeColor(main, 0.12);
    const disc = pal.feathers_light_face_disc;
    const discShadow = shadeColor(disc, -0.1);
    const speckle = pal.chest_speckles;
    const beak = pal.beak;
    const glasses = pal.accessory;
    const line = pal.line;

    const basePivotY = view === "bust" ? 192 : 274;
    const rootTransform = tr(
      0,
      pose.bodyY,
      pose.bodyRot,
      pose.bodyScaleX,
      pose.bodyScaleY,
      120,
      basePivotY
    );

    // Chest speckles helper (rows of small feather triangles)
    const renderSpeckles = (maxRows = 3) => {
      let s = `<g fill="${speckle}">`;
      // Row 1
      const r1 = [94, 107, 120, 133, 146];
      const y1 = [156, 161, 163, 161, 156];
      for (let i = 0; i < r1.length; i++) {
        const cx = r1[i];
        const cy = y1[i];
        s += `<path d="M ${cx - 4} ${cy} L ${cx + 4} ${cy} L ${cx} ${cy + 7.5} Z"/>`;
      }
      if (maxRows >= 2) {
        const r2 = [100, 113, 127, 140];
        const y2 = [171, 176, 176, 171];
        for (let i = 0; i < r2.length; i++) {
          const cx = r2[i];
          const cy = y2[i];
          s += `<path d="M ${cx - 4} ${cy} L ${cx + 4} ${cy} L ${cx} ${cy + 7.5} Z"/>`;
        }
      }
      if (maxRows >= 3) {
        const r3 = [108, 120, 132];
        const y3 = [186, 190, 186];
        for (let i = 0; i < r3.length; i++) {
          const cx = r3[i];
          const cy = y3[i];
          s += `<path d="M ${cx - 3.6} ${cy} L ${cx + 3.6} ${cy} L ${cx} ${cy + 6.8} Z"/>`;
        }
      }
      s += `</g>`;
      return s;
    };

    // 1. Tail Feathers & Talons (Full view)
    const renderLowerBody = () => {
      if (view === "bust") return "";
      const tailTransform = tr(0, 0, pose.tailRot * 0.6, 1, 1, 120, 238);
      return `<g id="${uid}-lower">
        <!-- Short fanned tail feathers -->
        <g id="${uid}-tail"${tailTransform}>
          <path d="M 104 236 L 98 258 C 103 263, 110 262, 112 256 L 114 262 C 118 265, 122 265, 126 262 L 128 256 C 130 262, 137 263, 142 258 L 136 236 Z" fill="${mainShadow}" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
        </g>
        <!-- Left Leg & Bird Talons -->
        <g id="${uid}-legL">
          <path d="M 96 232 C 95 244, 100 250, 108 248 L 110 234 Z" fill="${main}" stroke="${line}" stroke-width="3.2"/>
          <path d="M 101 247 L 99 260 L 87 265 C 84 267, 86 271, 90 270 L 98 267 L 96 274 C 95 277, 100 278, 102 274 L 105 266 L 113 269 C 116 270, 118 266, 114 264 L 106 259 L 106 247 Z" fill="${beak}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
        </g>
        <!-- Right Leg & Bird Talons -->
        <g id="${uid}-legR">
          <path d="M 144 232 C 145 244, 140 250, 132 248 L 130 234 Z" fill="${main}" stroke="${line}" stroke-width="3.2"/>
          <path d="M 139 247 L 141 260 L 153 265 C 156 267, 154 271, 150 270 L 142 267 L 144 274 C 145 277, 140 278, 138 274 L 135 266 L 127 269 C 124 270, 122 266, 126 264 L 134 259 L 134 247 Z" fill="${beak}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
        </g>
      </g>`;
    };

    const WING = { kind: "wing", color: main, pawColor: main, width: 15, line };

    // 2. Wings (Arms)
    const renderWings = () => {
      if (view === "bust") {
        // Bust wing shoulders matching owl_expressions.jpg
        return `<g id="${uid}-bust-wings">
          <path opacity="${pose.handLFront > 0.5 ? 0 : 1}" d="M 65 148 C 56 162, 55 180, 58 192 L 74 192 C 72 176, 73 160, 76 148 Z" fill="${main}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
          <path opacity="${pose.handRFront > 0.5 ? 0 : 1}" d="M 175 148 C 184 162, 185 180, 182 192 L 166 192 C 168 176, 167 160, 164 148 Z" fill="${main}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
        </g>`;
      }

      return renderArms("owl", pose, WING, "back", view, uid, 192, options.held);
    };

    // 3. Egg-shaped Owl Body + Head + Face Disc + Ear Horns + Glasses
    const renderEggBodyAndHead = () => {
      const headShiftX = f(pose.headX * 0.75);
      const headShiftY = f(pose.headY * 0.75);
      const headRot = f(pose.headRot * 0.75);
      const breathSX = f(1 + pose.breath);
      const breathSY = f(1 - pose.breath * 0.4);

      const earLRot = f(pose.earLRot - pose.earFlatten * 26);
      const earRRot = f(pose.earRRot + pose.earFlatten * 26);

      const eggBodyPath =
        view === "bust"
          ? `M 64 192 C 60 156, 63 108, 72 78 C 82 52, 98 44, 120 44 C 142 44, 158 52, 168 78 C 177 108, 180 156, 176 192 Z`
          : `M 120 44 C 146 44, 164 56, 172 92 C 180 128, 182 176, 170 212 C 160 236, 142 246, 120 246 C 98 246, 80 236, 70 212 C 58 176, 60 128, 68 92 C 76 56, 94 44, 120 44 Z`;

      return `<g id="${uid}-torso-head"${tr(0, 0, headRot, breathSX, breathSY, 120, 160)}>
        <!-- Main Egg Body -->
        <path d="${eggBodyPath}" fill="${main}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        ${
          view === "full"
            ? `<path d="M 74 206 C 88 234, 152 234, 166 206 C 156 234, 140 245, 120 245 C 100 245, 84 234, 74 206 Z" fill="${mainShadow}"/>`
            : ""
        }
        <!-- Rim highlight on crown -->
        <path d="M 90 52 Q 120 44 150 52" fill="none" stroke="${mainLight}" stroke-width="3" stroke-linecap="round" opacity="0.65"/>

        <!-- Crown speckles between ear tufts -->
        <g fill="${speckle}">
          <ellipse cx="120" cy="56" rx="2.6" ry="3.8"/>
          <ellipse cx="111" cy="61" rx="2.0" ry="3.0" transform="rotate(-12 111 61)"/>
          <ellipse cx="129" cy="61" rx="2.0" ry="3.0" transform="rotate(12 129 61)"/>
          <circle cx="120" cy="65" r="1.8"/>
        </g>

        <!-- Chest Speckles -->
        ${renderSpeckles(view === "bust" ? 2 : 3)}

        <!-- Face Group (shifts slightly with lookAt & head motion) -->
        <g id="${uid}-face" transform="translate(${headShiftX} ${headShiftY})">
          <!-- Heart-shaped Pale Face Disc -->
          <path d="M 120 77 C 108 62, 74 62, 69 96 C 65 124, 92 145, 120 152 C 148 145, 175 124, 171 96 C 166 62, 132 62, 120 77 Z" fill="${disc}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M 75 118 C 86 138, 104 146, 120 150 C 136 146, 154 138, 165 118 C 152 136, 136 144, 120 147 C 104 144, 88 136, 75 118 Z" fill="${discShadow}"/>

          <!-- Left Tufted Ear Horn -->
          <g id="${uid}-earL"${tr(0, 0, earLRot, 1, 1, 84, 66)}>
            <path d="M 118 76 C 104 62, 84 56, 68 58 L 54 44 C 52 38, 57 36, 63 42 L 62 34 C 62 29, 68 31, 72 39 C 86 46, 104 54, 120 68 Z" fill="${main}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
            <path d="M 68 58 L 56 54 C 52 52, 53 47, 60 48" fill="${main}" stroke="${line}" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>
          </g>

          <!-- Right Tufted Ear Horn -->
          <g id="${uid}-earR"${tr(0, 0, earRRot, 1, 1, 156, 66)}>
            <path d="M 122 76 C 136 62, 156 56, 172 58 L 186 44 C 188 38, 183 36, 177 42 L 178 34 C 178 29, 172 31, 168 39 C 154 46, 136 54, 120 68 Z" fill="${main}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
            <path d="M 172 58 L 184 54 C 188 52, 187 47, 180 48" fill="${main}" stroke="${line}" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>
          </g>

          <!-- Cheek Blush -->
          ${renderCheekBlush(pose, {
            leftX: 78,
            rightX: 162,
            y: 125,
            rx: 12,
            ry: 6,
            color: "#F27988",
          })}

          <!-- Huge Round Amber Eyes -->
          ${renderEyes(
            pose,
            {
              leftX: 93,
              rightX: 147,
              y: 103,
              rx: 19,
              ry: 19,
              irisColor: pal.eyes,
              pupilColor: "#241811",
              lidColor: main,
              lineColor: line,
              almond: false,
              irisRatio: 0.78,
              pupilRatio: 0.56,
              heartColor: "#3D2218",
              heartStroke: pal.eyes,
            },
            uid
          )}

          <!-- Expressive Eyebrows -->
          ${renderBrows(pose, {
            leftX: 93,
            rightX: 147,
            y: 78,
            width: 20,
            thickness: 3.8,
            color: line,
            style: "arch",
          })}

          <!-- Round Wire-Rimmed Blue Glasses (Accessory) -->
          <g id="${uid}-glasses" fill="none" opacity="${options.accessory === false ? 0 : 1}">
            <!-- Side temples -->
            <line x1="65" y1="98" x2="71" y2="100" stroke="${glasses}" stroke-width="3.4" stroke-linecap="round"/>
            <line x1="175" y1="98" x2="169" y2="100" stroke="${glasses}" stroke-width="3.4" stroke-linecap="round"/>
            <!-- Bridge -->
            <path d="M 115 103 Q 120 98 125 103" stroke="${glasses}" stroke-width="3.6" stroke-linecap="round"/>
            <!-- Left & Right Round Frames -->
            <circle cx="93" cy="103" r="22.5" stroke="${line}" stroke-width="4.8" opacity="0.22"/>
            <circle cx="147" cy="103" r="22.5" stroke="${line}" stroke-width="4.8" opacity="0.22"/>
            <circle cx="93" cy="103" r="22.5" stroke="${glasses}" stroke-width="3.4"/>
            <circle cx="147" cy="103" r="22.5" stroke="${glasses}" stroke-width="3.4"/>
          </g>

          <!-- Hooked Beak (Mouth) -->
          ${renderOwlBeak(pose, {
            cx: 120 + pose.lookX * 2.5,
            cy: 117 + pose.lookY * 1.8,
            beakColor: beak,
            lineColor: line,
          })}
        </g>
      </g>`;
    };


    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderLowerBody()}
        ${renderWings()}
        ${renderEggBodyAndHead()}
        ${renderArms("owl", pose, WING, "front", view, uid, 192, options.held)}
        ${renderArms("owl", pose, WING, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
