// Miso the Tuxedo Cat (id: "cat") — layered vector rig matching cat_turnaround.jpg & cat_expressions.jpg.

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

export const cat = {
  id: "cat",
  name: "Miso",
  species: "tuxedo cat",
  role: "the scout: fast, nosy, finds things first",
  defaultPalette: {
    fur_main: "#2B2D38",
    fur_white_bib_and_paws: "#FAFAF7",
    inner_ears_and_nose: "#F29CB1",
    eyes: "#A8D84E",
    accessory: "#E8B23A",
    line: "#1C1D24",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "cat" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furHighlight = shadeColor(furMain, 0.14);
    const furWhite = pal.fur_white_bib_and_paws;
    const furWhiteShadow = shadeColor(furWhite, -0.09);
    const pink = pal.inner_ears_and_nose;
    const bellGold = pal.accessory;
    const bellDark = shadeColor(bellGold, -0.2);
    const collarRed = "#C94038";
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

    // 1. Hooked Tail (Full view)
    const FRONT_ARM = { kind: "paw", color: furMain, lowerColor: furWhite, lowerFrom: 0.62, pawColor: furWhite, pawR: 7, width: 12, line };

    const renderTail = () => {
      if (view === "bust") return "";
      const puff = 1 + (pose.tailPuff || 0) * 0.22;
      const tailTransform = tr(0, 0, pose.tailRot, puff, puff, 136, 232);
      return `<g id="${uid}-tail"${tailTransform}>
        <path d="M 136 235 C 166 244, 198 242, 200 220 C 201 208, 191 202, 184 208 C 180 212, 184 220, 189 218 C 191 226, 170 232, 138 224 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
      </g>`;
    };

    // 2. Body, White Bib, Legs & White Paws
    const renderBodyAndLimbs = () => {
      const breathSX = f(1 + pose.breath);
      const breathSY = f(1 - pose.breath * 0.45);
      const torsoTransform = tr(0, 0, 0, breathSX, breathSY, 120, 195);

      if (view === "bust") {
        // Bust shoulders & white bib matching left panel of cat_turnaround.jpg
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 88 150 L 76 186 C 92 193, 148 193, 164 186 L 152 150 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 98 154 C 94 168, 94 182, 96 190 C 110 193, 130 193, 144 190 C 146 182, 146 168, 142 154 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
        </g>`;
      }

      const ARM = { kind: "paw", color: furMain, lowerColor: furWhite, lowerFrom: 0.62, pawColor: furWhite, pawR: 7, width: 12, line };

      return `<g id="${uid}-full-body">
        <!-- Left Leg & White Paw -->
        <g id="${uid}-legL">
          <path d="M 90 218 C 86 236, 88 254, 91 264 L 85 268 C 80 271, 82 277, 89 277 L 108 277 C 112 277, 113 272, 110 266 L 111 224 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 90 258 L 110 258 L 110 266 C 113 272, 112 277, 108 277 L 89 277 C 82 277, 80 271, 85 268 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <line x1="92" y1="271" x2="92" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="99" y1="271" x2="99" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        <!-- Right Leg & White Paw -->
        <g id="${uid}-legR">
          <path d="M 150 218 C 154 236, 152 254, 149 264 L 155 268 C 160 271, 158 277, 151 277 L 132 277 C 128 277, 127 272, 130 266 L 129 224 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 150 258 L 130 258 L 130 266 C 127 272, 128 277, 132 277 L 151 277 C 158 277, 160 271, 155 268 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
          <line x1="141" y1="271" x2="141" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
          <line x1="148" y1="271" x2="148" y2="277" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        ${renderArms("cat", pose, ARM, "back", view, uid, 192, options.held)}
        <!-- Compact Tuxedo Torso & White Bib -->
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 92 152 C 84 176, 84 206, 90 226 C 96 240, 144 240, 150 226 C 156 206, 156 176, 148 152 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 100 154 C 95 174, 94 206, 102 222 C 109 232, 131 232, 138 222 C 146 206, 145 174, 140 154 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.2" stroke-linejoin="round"/>
        </g>
      </g>`;
    };

    // 3. Red Collar & Gold Bell Accessory
    const renderCollarAndBell = () => {
      const swing = f(pose.headRot * 0.6 + pose.bodyRot * 0.8);
      return `<g id="${uid}-collar">
        <!-- Red collar band -->
        <path d="M 88 147 C 96 156, 144 156, 152 147 L 154 153 C 144 163, 96 163, 86 153 Z" fill="${collarRed}" stroke="${line}" stroke-width="3.3" stroke-linejoin="round"/>
        <!-- Gold loop & Bell -->
        <g transform="rotate(${swing} 120 156)">
          <rect x="117.5" y="152" width="5" height="6" rx="1.5" fill="${bellGold}" stroke="${line}" stroke-width="2.4"/>
          <circle cx="120" cy="165" r="9.5" fill="${bellGold}" stroke="${line}" stroke-width="3.3"/>
          <path d="M 112 167 A 9 9 0 0 0 128 167 A 9.5 7 0 0 1 112 167 Z" fill="${bellDark}"/>
          <circle cx="116.5" cy="161.5" r="2.2" fill="#FFFFFF" fill-opacity="0.7"/>
          <circle cx="120" cy="167.5" r="2" fill="${line}"/>
          <line x1="120" y1="168" x2="120" y2="173.5" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>
        </g>
      </g>`;
    };

    // 4. Thinking White Paw on Chin (matches cat_expressions.jpg Row 1 Col 3)

    // 5. Head, Ears, White Blaze, Whiskers, Eyes & Face
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      const earLRot = f(pose.earLRot - pose.earFlatten * 30);
      const earRRot = f(pose.earRRot + pose.earFlatten * 30);
      const earSY = f(1 - pose.earFlatten * 0.14);

      const muzzleX = f(pose.lookX * 3.0);
      const muzzleY = f(pose.lookY * 2.0);

      return `<g id="${uid}-head"${headTransform}>
        <!-- Left Ear -->
        <g id="${uid}-earL"${tr(0, 0, earLRot, 1, earSY, 82, 72)}>
          <path d="M 65 86 C 59 62, 60 36, 67 22 C 82 30, 98 46, 106 66 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 70 79 C 66 60, 67 42, 71 31 C 82 38, 92 50, 97 64 Z" fill="${pink}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        </g>

        <!-- Right Ear -->
        <g id="${uid}-earR"${tr(0, 0, earRRot, 1, earSY, 158, 72)}>
          <path d="M 175 86 C 181 62, 180 36, 173 22 C 158 30, 142 46, 134 66 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 170 79 C 174 60, 173 42, 169 31 C 158 38, 148 50, 143 64 Z" fill="${pink}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        </g>

        <!-- Head Base -->
        <path d="M 120 48 C 154 48, 174 72, 174 106 C 174 134, 152 150, 120 150 C 88 150, 66 134, 66 106 C 66 72, 86 48, 120 48 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 94 54 Q 120 48 146 54" fill="none" stroke="${furHighlight}" stroke-width="2.8" stroke-linecap="round" opacity="0.6"/>

        <!-- Three Whiskers Each Side -->
        <g stroke="${line}" stroke-width="3" stroke-linecap="round">
          <line x1="68" y1="108" x2="50" y2="105"/>
          <line x1="67" y1="115" x2="48" y2="116"/>
          <line x1="69" y1="122" x2="52" y2="127"/>
          <line x1="172" y1="108" x2="190" y2="105"/>
          <line x1="173" y1="115" x2="192" y2="116"/>
          <line x1="171" y1="122" x2="188" y2="127"/>
        </g>

        <!-- Tuxedo White Blaze & Muzzle Patch -->
        <path d="M 120 76 C 123 76, 125 92, 128 108 C 132 117, 150 120, 150 133 C 150 144, 137 149, 120 149 C 103 149, 90 144, 90 133 C 90 120, 108 117, 112 108 C 115 92, 117 76, 120 76 Z" fill="${furWhite}"/>
        <path d="M 95 138 C 106 146, 134 146, 145 138 C 136 146, 128 149, 120 149 C 112 149, 104 146, 95 138 Z" fill="${furWhiteShadow}"/>

        <!-- Re-stroke head outline cleanly over blaze bottom -->
        <path d="M 120 48 C 154 48, 174 72, 174 106 C 174 134, 152 150, 120 150 C 88 150, 66 134, 66 106 C 66 72, 86 48, 120 48 Z" fill="none" stroke="${line}" stroke-width="3.6"/>

        <!-- Cheek Blush -->
        ${renderCheekBlush(pose, {
          leftX: 80,
          rightX: 160,
          y: 124,
          rx: 11,
          ry: 5.8,
          color: "#F2798F",
        })}

        <!-- Big Lime-Green Eyes -->
        ${renderEyes(
          pose,
          {
            leftX: 91,
            rightX: 149,
            y: 103,
            rx: 16,
            ry: 15,
            irisColor: pal.eyes,
            pupilColor: line,
            lidColor: furMain,
            lineColor: line,
            almond: false,
            irisRatio: 0.82,
            pupilRatio: 0.56,
            heartColor: "#F26B8A",
            heartStroke: line,
          },
          uid
        )}

        <!-- White Oval Brow Beans -->
        ${renderBrows(pose, {
          leftX: 95,
          rightX: 145,
          y: 80,
          width: 13,
          thickness: 3.8,
          color: furWhite,
          style: "bean",
          stroke: line,
        })}

        <!-- Muzzle: Pink Nose & Cat Mouth -->
        <g transform="translate(${muzzleX} ${muzzleY})">
          ${renderMouth(
            pose,
            {
              cx: 120,
              cy: 131,
              width: 24,
              lineColor: line,
              splitSmile: true,
              noseBottomY: 124,
            },
            uid
          )}
          <!-- Pink Triangle Cat Nose -->
          <path d="M 113 117 C 113 114.5, 127 114.5, 127 117 C 127 120.5, 122.5 124.5, 120 124.5 C 117.5 124.5, 113 120.5, 113 117 Z" fill="${pink}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderTail()}
        ${renderBodyAndLimbs()}
        ${options.accessory === false ? "" : renderCollarAndBell()}
        ${renderArms("cat", pose, FRONT_ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("cat", pose, FRONT_ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
