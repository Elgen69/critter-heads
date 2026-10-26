// Kit the Red Fox (id: "fox") — layered vector rig matching fox_turnaround.jpg & fox_expressions.jpg.

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

export const fox = {
  id: "fox",
  name: "Kit",
  species: "red fox",
  role: "lead: the builder, curious and driven",
  defaultPalette: {
    fur_main: "#E8743B",
    fur_light: "#FFF4E6",
    fur_dark_socks_and_ear_tips: "#2E2A33",
    eyes: "#2FB8A6",
    nose: "#2E2A33",
    accessory: "#1F6F78",
    line: "#3A2A24",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "fox" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furShadow = shadeColor(furMain, -0.14);
    const furLight = pal.fur_light;
    const furLightShadow = shadeColor(furLight, -0.09);
    const darkTip = pal.fur_dark_socks_and_ear_tips;
    const scarfMain = pal.accessory;
    const scarfDark = shadeColor(scarfMain, -0.18);
    const scarfLight = shadeColor(scarfMain, 0.14);
    const line = pal.line;

    const basePivotY = view === "bust" ? 190 : 274;
    const rootTransform = tr(
      0,
      pose.bodyY,
      pose.bodyRot,
      pose.bodyScaleX,
      pose.bodyScaleY,
      120,
      basePivotY
    );

    const FRONT_ARM = { kind: "paw", color: furMain, lowerColor: darkTip, lowerFrom: 0.45, pawColor: darkTip, pawR: 7, width: 12, line };

    // 1. Tail (Full view) — huge curled orange tail with fluffy cream tip
    const renderTail = () => {
      if (view === "bust") return "";
      const puff = 1 + (pose.tailPuff || 0) * 0.18;
      const tailTransform = tr(0, 0, pose.tailRot, puff, puff, 134, 232);
      return `<g id="${uid}-tail"${tailTransform}>
        <path d="M 130 238 C 154 252, 198 242, 206 196 C 212 162, 198 134, 220 132 C 214 114, 184 110, 170 126 C 165 122, 162 126, 160 132 C 152 152, 160 182, 146 206 C 138 218, 128 224, 126 232 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 134 238 C 160 248, 196 234, 202 192 C 204 176, 198 160, 192 154 C 194 184, 178 220, 134 234 Z" fill="${furShadow}"/>
        <path d="M 160 132 C 162 126, 165 122, 170 126 C 184 110, 214 114, 220 132 C 204 134, 208 154, 204 172 L 194 162 L 188 174 L 178 160 L 170 170 L 160 156 C 157 147, 158 138, 160 132 Z" fill="${furLight}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
      </g>`;
    };

    // 2. Body, Legs, Resting Arms (Full vs Bust)
    const renderBodyAndLimbs = () => {
      const breathScaleX = 1 + pose.breath;
      const breathScaleY = 1 - pose.breath * 0.5;
      const torsoTransform = tr(0, 0, 0, breathScaleX, breathScaleY, 120, 195);

      if (view === "bust") {
        // Bust base matching left panel of fox_turnaround.jpg & fox_expressions.jpg
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 88 152 L 77 175 L 120 192 L 163 175 L 152 152 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 96 158 L 89 178 L 120 192 L 151 178 L 144 158 Z" fill="${furLight}" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
        </g>`;
      }

      const ARM = { kind: "paw", color: furMain, lowerColor: darkTip, lowerFrom: 0.45, pawColor: darkTip, pawR: 7, width: 12, line };

      return `<g id="${uid}-full-body">
        <!-- Legs -->
        <g id="${uid}-legL">
          <path d="M 94 218 C 84 228, 86 244, 93 252 L 88 268 C 82 270, 80 276, 86 277 L 106 277 C 110 277, 111 272, 108 266 L 108 224 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 92 250 L 108 249 L 108 266 C 111 272, 110 277, 106 277 L 86 277 C 80 276, 82 270, 88 268 Z" fill="${darkTip}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <line x1="91" y1="272" x2="91" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="98" y1="272" x2="98" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        <g id="${uid}-legR">
          <path d="M 146 218 C 156 228, 154 244, 147 252 L 152 268 C 158 270, 160 276, 154 277 L 134 277 C 130 277, 129 272, 132 266 L 132 224 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 148 250 L 132 249 L 132 266 C 129 272, 130 277, 134 277 L 154 277 C 160 276, 158 270, 152 268 Z" fill="${darkTip}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <line x1="142" y1="272" x2="142" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="149" y1="272" x2="149" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        ${renderArms("fox", pose, ARM, "back", view, uid, 192, options.held)}
        <!-- Torso -->
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 94 154 C 88 178, 86 206, 92 226 C 98 240, 142 240, 148 226 C 154 206, 152 178, 146 154 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Cream Belly & Fluffy Chest Bib -->
          <ellipse cx="120" cy="204" rx="18" ry="28" fill="${furLight}" stroke="${line}" stroke-width="2.6"/>
          <path d="M 98 160 L 95 170 L 103 168 L 102 180 L 111 177 L 120 189 L 129 177 L 138 180 L 137 168 L 145 170 L 142 160 Z" fill="${furLight}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
        </g>
      </g>`;
    };

    // 3. Scarf Accessory around neck
    const renderScarf = () => {
      const sway = f(pose.headRot * 0.4 + pose.bodyRot * 0.5);
      return `<g id="${uid}-scarf">
        <!-- Hanging scarf tail on viewer's right -->
        <g transform="rotate(${sway} 135 160)">
          <path d="M 128 156 L 144 156 L 147 194 L 129 197 Z" fill="${scarfMain}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <path d="M 129 158 L 136 158 L 137 195 L 129 197 Z" fill="${scarfDark}" fill-opacity="0.45"/>
          <line x1="137" y1="184" x2="137" y2="195" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        <!-- Wrapped neck bands -->
        <path d="M 88 144 C 86 154, 100 164, 120 164 C 140 164, 154 154, 152 144 C 150 138, 90 138, 88 144 Z" fill="${scarfDark}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M 86 149 C 84 160, 100 171, 120 171 C 140 171, 156 160, 154 149 C 142 156, 98 156, 86 149 Z" fill="${scarfMain}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M 94 154 Q 120 163 146 153" fill="none" stroke="${scarfLight}" stroke-width="2.2" stroke-linecap="round" opacity="0.65"/>
      </g>`;
    };

    // 5. Head & Face Group
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      const earLRot = f(pose.earLRot - pose.earFlatten * 28);
      const earRRot = f(pose.earRRot + pose.earFlatten * 28);
      const earSY = f(1 - pose.earFlatten * 0.14);

      const muzzleX = f(pose.lookX * 3.2);
      const muzzleY = f(pose.lookY * 2.0);

      return `<g id="${uid}-head"${headTransform}>
        <!-- Left Ear -->
        <g id="${uid}-earL"${tr(0, 0, earLRot, 1, earSY, 82, 74)}>
          <path d="M 65 88 C 56 62, 58 34, 67 16 C 84 26, 98 48, 104 72 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Dark ear tip -->
          <path d="M 60 50 C 60 35, 62 24, 67 16 C 77 22, 86 33, 93 46 Q 76 46 60 50 Z" fill="${darkTip}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <!-- Inner ear & cream tufts -->
          <path d="M 69 78 C 64 60, 65 42, 70 28 C 80 36, 89 52, 93 68 Z" fill="#F2A679" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M 70 80 L 66 66 L 75 70 L 71 54 L 82 62 L 80 46 L 94 68 Z" fill="${furLight}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        </g>

        <!-- Right Ear -->
        <g id="${uid}-earR"${tr(0, 0, earRRot, 1, earSY, 158, 74)}>
          <path d="M 175 88 C 184 62, 182 34, 173 16 C 156 26, 142 48, 136 72 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Dark ear tip -->
          <path d="M 180 50 C 180 35, 178 24, 173 16 C 163 22, 154 33, 147 46 Q 164 46 180 50 Z" fill="${darkTip}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <!-- Inner ear & cream tufts -->
          <path d="M 171 78 C 176 60, 175 42, 170 28 C 160 36, 151 52, 147 68 Z" fill="#F2A679" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M 170 80 L 174 66 L 165 70 L 169 54 L 158 62 L 160 46 L 146 68 Z" fill="${furLight}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        </g>

        <!-- Head Base & Spiky Cheek Tufts -->
        <path d="M 120 48 C 148 48, 168 68, 173 96 L 188 106 L 178 113 L 184 119 C 168 136, 145 148, 120 148 C 95 148, 72 136, 56 119 L 62 113 L 52 106 L 67 96 C 72 68, 92 48, 120 48 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>

        <!-- Top hair tuft -->
        <path d="M 110 51 L 114 41 L 120 47 L 125 39 L 128 49" fill="${furMain}" stroke="${line}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Cream Lower Face / Cheek Sweep -->
        <path d="M 56 119 L 62 113 L 54 107 C 72 109, 86 116, 102 121 C 110 112, 130 112, 138 121 C 154 116, 168 109, 186 107 L 178 113 L 184 119 C 168 136, 145 148, 120 148 C 95 148, 72 136, 56 119 Z" fill="${furLight}"/>
        <path d="M 70 132 C 92 145, 148 145, 170 132 C 154 144, 138 148, 120 148 C 102 148, 86 144, 70 132 Z" fill="${furLightShadow}"/>
        <!-- Cheek dividing contour & outer outline -->
        <path d="M 55 107 C 72 109, 88 116, 103 121 C 111 113, 129 113, 137 121 C 152 116, 168 109, 185 107" fill="none" stroke="${furShadow}" stroke-width="2" stroke-linecap="round"/>
        <path d="M 120 48 C 148 48, 168 68, 173 96 L 188 106 L 178 113 L 184 119 C 168 136, 145 148, 120 148 C 95 148, 72 136, 56 119 L 62 113 L 52 106 L 67 96 C 72 68, 92 48, 120 48 Z" fill="none" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>

        <!--Cheek Blush-->
        ${renderCheekBlush(pose, {
          leftX: 78,
          rightX: 162,
          y: 121,
          rx: 12,
          ry: 6.5,
          color: "#F47B88",
        })}

        <!-- Eyes -->
        ${renderEyes(
          pose,
          {
            leftX: 90,
            rightX: 150,
            y: 103,
            rx: 15.5,
            ry: 13.5,
            irisColor: pal.eyes,
            pupilColor: "#182226",
            lidColor: furMain,
            lineColor: line,
            almond: true,
            heartColor: "#F26B8A",
          },
          uid
        )}

        <!-- Cream Brow Beans (Fox's signature oval brow spots) -->
        ${renderBrows(pose, {
          leftX: 96,
          rightX: 144,
          y: 83,
          width: 13,
          thickness: 4.2,
          color: furLight,
          style: "bean",
          stroke: line,
        })}

        <!-- Muzzle: Nose & Mouth -->
        <g transform="translate(${muzzleX} ${muzzleY})">
          ${renderMouth(
            pose,
            {
              cx: 120,
              cy: 131,
              width: 25,
              lineColor: line,
              splitSmile: true,
              noseBottomY: 124,
            },
            uid
          )}
          <!-- Fox Nose -->
          <path d="M 111 118 C 111 114, 129 114, 129 118 C 129 123, 124 126, 120 126 C 116 126, 111 123, 111 118 Z" fill="${pal.nose}" stroke="${line}" stroke-width="2.6"/>
          <ellipse cx="117.5" cy="117.5" rx="3" ry="1.3" fill="#FFFFFF" fill-opacity="0.45"/>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderTail()}
        ${renderBodyAndLimbs()}
        ${options.accessory === false ? "" : renderScarf()}
        ${renderArms("fox", pose, FRONT_ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("fox", pose, FRONT_ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
