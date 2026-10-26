// Bao the Giant Panda (id: "panda") — layered vector rig matching panda_turnaround.jpg & panda_expressions.jpg.

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
import { renderArms, armPoints } from "../limbs.js";

export const panda = {
  id: "panda",
  name: "Bao",
  species: "giant panda",
  role: "the anchor: steady, reliable, the team's calm",
  defaultPalette: {
    fur_white: "#FBFBF8",
    fur_black: "#24242B",
    eye_patches: "#24242B",
    eyes: "#4A3A2E",
    cheeks_blush: "#F4A7A0",
    accessory: "#5FBF8F",
    line: "#1D1D23",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "panda" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furWhite = pal.fur_white;
    const furWhiteShadow = shadeColor(furWhite, -0.08);
    const furBlack = pal.fur_black;
    const furBlackLight = shadeColor(furBlack, 0.12);
    const patchColor = pal.eye_patches;
    const blushColor = pal.cheeks_blush;
    const bamboo = pal.accessory;
    const bambooDark = shadeColor(bamboo, -0.18);
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

    // 1. Body, Black Shoulder Band, Arms & Legs
    const FRONT_ARM = { kind: "paw", color: furBlack, pawColor: furBlack, pawR: 8.5, width: 16, line };

    // Bamboo stalk held between the paws (idle munching)
    const renderBamboo = () => {
      const b = clamp(pose.bamboo || 0, 0, 1);
      if (b < 0.05) return "";
      const L = armPoints("panda", pose, "L").hand;
      const R = armPoints("panda", pose, "R").hand;
      const mx = (L[0] + R[0]) / 2, my = (L[1] + R[1]) / 2;
      const ang = (Math.atan2(R[1] - L[1], R[0] - L[0]) * 180) / Math.PI - 64;
      const green = pal.accessory, dark = shadeColor(green, -0.25);
      return `<g opacity="${f(b)}" transform="translate(${f(mx)} ${f(my)}) rotate(${f(ang)})">
        <rect x="-5" y="-34" width="10" height="58" rx="4" fill="${green}" stroke="${line}" stroke-width="3"/>
        <path d="M -5 -12 L 5 -12 M -5 8 L 5 8" stroke="${dark}" stroke-width="2.4"/>
        <path d="M 4 -24 C 14 -30, 20 -28, 24 -22 C 16 -20, 10 -20, 4 -22 Z" fill="${green}" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/>
      </g>`;
    };

    const renderBodyAndLimbs = () => {
      const breathSX = f(1 + pose.breath);
      const breathSY = f(1 - pose.breath * 0.45);
      const torsoTransform = tr(0, 0, 0, breathSX, breathSY, 120, 198);

      if (view === "bust") {
        // Bust black shoulder arch & white upper belly (matches left panel of panda_turnaround.jpg)
        return `<g id="${uid}-bust-body"${torsoTransform}>
          <path d="M 74 148 C 58 160, 48 176, 44 190 L 196 190 C 192 176, 182 160, 166 148 Z" fill="${furBlack}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 74 190 C 86 172, 154 172, 166 190 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>
        </g>`;
      }

      const ARM = { kind: "paw", color: furBlack, pawColor: furBlack, pawR: 8.5, width: 16, line };

      return `<g id="${uid}-full-body">
        <!-- Tiny stubby white tail peeking on the right hip -->
        <g id="${uid}-tail"${tr(0, 0, pose.tailRot * 0.5, 1, 1, 162, 232)}>
          <circle cx="168" cy="232" r="9" fill="${furWhite}" stroke="${line}" stroke-width="3.2"/>
        </g>

        <!-- Stubby Black Legs & Feet -->
        <g id="${uid}-legs">
          <path d="M 76 218 C 74 242, 78 260, 82 268 L 78 270 C 74 273, 76 277, 84 277 L 111 277 C 115 277, 116 271, 114 265 L 115 234 Z" fill="${furBlack}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 164 218 C 166 242, 162 260, 158 268 L 162 270 C 166 273, 164 277, 156 277 L 129 277 C 125 277, 124 271, 126 265 L 125 234 Z" fill="${furBlack}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 84 271 Q 96 266 108 271 M 132 271 Q 144 266 156 271" fill="none" stroke="${furBlackLight}" stroke-width="2" stroke-linecap="round"/>
        </g>

        ${renderArms("panda", pose, ARM, "back", view, uid, 192, options.held)}

        <!-- Big Round Ball Body & Black Shoulder Band -->
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 80 148 C 66 174, 64 212, 78 234 C 92 250, 148 250, 162 234 C 176 212, 174 174, 160 148 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 80 222 C 94 244, 146 244, 160 222 C 150 242, 136 247, 120 247 C 104 247, 90 242, 80 222 Z" fill="${furWhiteShadow}"/>
          <!-- Black Shoulder Band -->
          <path d="M 80 148 C 72 162, 70 174, 71 182 C 92 170, 148 170, 169 182 C 170 174, 168 162, 160 148 Z" fill="${furBlack}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        </g>
      </g>`;
    };

    // 2. Thinking Black Paw on Chin (matches panda_expressions.jpg Row 1 Col 3)

    // 3. Round Head, Round Black Ears, Bamboo Sprout Accessory, Teardrop Eye Patches & Face
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      const earLRot = f(pose.earLRot - pose.earFlatten * 24);
      const earRRot = f(pose.earRRot + pose.earFlatten * 24);
      const earYDrop = f(pose.earFlatten * 8);

      const muzzleX = f(pose.lookX * 3.0);
      const muzzleY = f(pose.lookY * 2.0);

      return `<g id="${uid}-head"${headTransform}>
        <!-- Left Round Black Ear -->
        <g id="${uid}-earL"${tr(0, earYDrop, earLRot, 1, 1, 74, 64)}>
          <circle cx="67" cy="54" r="21" fill="${furBlack}" stroke="${line}" stroke-width="3.6"/>
          <circle cx="68" cy="56" r="12" fill="${furBlackLight}" fill-opacity="0.35"/>
        </g>

        <!-- Right Round Black Ear + Bamboo Sprout Accessory -->
        <g id="${uid}-earR"${tr(0, earYDrop, earRRot, 1, 1, 166, 64)}>
          <!-- Green Bamboo Leaf Sprout tucked behind right ear -->
          <g id="${uid}-bamboo" opacity="${options.accessory === false ? 0 : 1}" transform="rotate(${f(pose.headRot * 0.5)} 154 48)">
            <path d="M 150 52 Q 158 34 166 22" fill="none" stroke="${bambooDark}" stroke-width="3.2" stroke-linecap="round"/>
            <!-- Upper leaf -->
            <path d="M 154 44 C 154 28, 166 16, 178 14 C 176 28, 166 40, 154 44 Z" fill="${bamboo}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
            <path d="M 156 42 Q 166 28 175 17" fill="none" stroke="${bambooDark}" stroke-width="1.8" stroke-linecap="round"/>
            <!-- Side leaf -->
            <path d="M 152 46 C 144 36, 142 24, 146 16 C 154 24, 156 36, 152 46 Z" fill="${bamboo}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
          </g>
          <circle cx="173" cy="54" r="21" fill="${furBlack}" stroke="${line}" stroke-width="3.6"/>
          <circle cx="172" cy="56" r="12" fill="${furBlackLight}" fill-opacity="0.35"/>
        </g>

        <!-- Very Round Squishy-Cheeked White Head -->
        <path d="M 120 46 C 158 46, 178 72, 181 106 C 184 134, 160 152, 120 152 C 80 152, 56 134, 59 106 C 62 72, 82 46, 120 46 Z" fill="${furWhite}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 65 128 C 82 146, 158 146, 175 128 C 160 146, 142 151, 120 151 C 98 151, 80 146, 65 128 Z" fill="${furWhiteShadow}"/>

        <!-- Soft Pink Cheek Blush (always visible on Bao, intensifies in love) -->
        ${renderCheekBlush(pose, {
          leftX: 76,
          rightX: 164,
          y: 124,
          rx: 12.5,
          ry: 6.2,
          color: blushColor,
        })}

        <!-- Black Teardrop Eye Patches -->
        <g fill="${patchColor}" stroke="${line}" stroke-width="3">
          <ellipse cx="90" cy="103" rx="22" ry="18.5" transform="rotate(-20 90 103)"/>
          <ellipse cx="150" cy="103" rx="22" ry="18.5" transform="rotate(20 150 103)"/>
        </g>

        <!-- Warm Brown Panda Eyes -->
        ${renderEyes(
          pose,
          {
            leftX: 92,
            rightX: 148,
            y: 102,
            rx: 13.5,
            ry: 14,
            irisColor: pal.eyes,
            pupilColor: "#181412",
            lidColor: patchColor,
            lineColor: line,
            almond: false,
            irisRatio: 0.78,
            pupilRatio: 0.56,
            heartColor: "#F26B8A",
          },
          uid
        )}

        <!-- Dark Bean Eyebrows on White Forehead -->
        ${renderBrows(pose, {
          leftX: 96,
          rightX: 144,
          y: 76,
          width: 15,
          thickness: 4.4,
          color: furBlack,
          style: "bean",
        })}

        <!-- Muzzle: Nose & Gentle Smile -->
        <g transform="translate(${muzzleX} ${muzzleY})">
          <!-- Subtle muzzle bridge crease -->
          <path d="M 113 108 Q 120 105 127 108" fill="none" stroke="${furWhiteShadow}" stroke-width="2.4" stroke-linecap="round"/>
          ${renderMouth(
            pose,
            {
              cx: 120,
              cy: 131,
              width: 24,
              lineColor: line,
              splitSmile: true,
              noseBottomY: 123,
            },
            uid
          )}
          <!-- Dark Panda Nose -->
          <path d="M 111 116 C 111 112.5, 129 112.5, 129 116 C 129 121, 124 124, 120 124 C 116 124, 111 121, 111 116 Z" fill="${furBlack}" stroke="${line}" stroke-width="2.6"/>
          <ellipse cx="117.5" cy="115.5" rx="3" ry="1.3" fill="#FFFFFF" fill-opacity="0.45"/>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderBodyAndLimbs()}
        ${renderArms("panda", pose, FRONT_ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderBamboo()}
        ${renderArms("panda", pose, FRONT_ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
