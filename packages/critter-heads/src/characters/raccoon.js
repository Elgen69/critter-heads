// Bandit the Raccoon (id: "raccoon") — layered vector rig matching raccoon_turnaround.jpg & raccoon_expressions.jpg.

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

export const raccoon = {
  id: "raccoon",
  name: "Bandit",
  species: "raccoon",
  role: "the night shift: works while everyone sleeps",
  defaultPalette: {
    fur_main: "#8D8F99",
    fur_light: "#E4E2DD",
    mask_and_rings: "#2F3038",
    eyes: "#E9EEF2",
    pupils: "#1B1C22",
    accessory: "#5B3FA0",
    line: "#24252C",
  },

  render(state, options) {
    const { pose, timeMs } = state;
    const { view = "bust", shadow = true, uid = "raccoon" } = options;
    const pal = { ...this.defaultPalette, ...(options.palette || {}) };

    const furMain = pal.fur_main;
    const furShadow = shadeColor(furMain, -0.14);
    const furLight = pal.fur_light;
    const mask = pal.mask_and_rings;
    const hoodie = pal.accessory;
    const hoodieDark = shadeColor(hoodie, -0.18);
    const hoodieLight = shadeColor(hoodie, 0.14);
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

    // 1. Thick Bushy Striped Ringed Tail (5 dark rings)
    const FRONT_ARM = { kind: "sleeve", color: hoodie, cuffColor: hoodieDark, pawColor: mask, width: 15, line };

    const renderTail = () => {
      if (view === "bust") {
        // Peeking ringed tail behind right shoulder (matches raccoon_expressions.jpg)
        const tailRot = f(pose.tailRot * 0.8);
        const clipId = `${uid}-tail-bust-clip`;
        const d = `M 152 192 C 156 164, 174 138, 192 142 C 206 146, 206 174, 190 192 Z`;
        return `<g id="${uid}-tail"${tr(0, 0, tailRot, 1, 1, 162, 188)}>
          <defs><clipPath id="${clipId}"><path d="${d}"/></clipPath></defs>
          <path d="${d}" fill="${furMain}"/>
          <g clip-path="url(#${clipId})" fill="${mask}">
            <polygon points="150,180 208,192 204,200 148,188"/>
            <polygon points="154,164 210,178 207,186 152,172"/>
            <polygon points="162,148 210,163 207,171 158,156"/>
            <polygon points="176,136 210,148 206,155 170,143"/>
          </g>
          <path d="${d}" fill="none" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
        </g>`;
      }

      const puff = 1 + (pose.tailPuff || 0) * 0.15;
      const tailTransform = tr(0, 0, pose.tailRot, puff, puff, 142, 232);
      const clipId = `${uid}-tail-full-clip`;
      const tailPath = `M 140 226 C 166 214, 212 208, 220 230 C 226 248, 198 266, 166 260 C 148 256, 138 244, 136 234 Z`;
      return `<g id="${uid}-tail"${tailTransform}>
        <defs><clipPath id="${clipId}"><path d="${tailPath}"/></clipPath></defs>
        <path d="${tailPath}" fill="${furMain}"/>
        <g clip-path="url(#${clipId})" fill="${mask}">
          <rect x="145" y="205" width="9" height="60" transform="rotate(12 149 235)"/>
          <rect x="161" y="205" width="10" height="60" transform="rotate(10 166 235)"/>
          <rect x="178" y="205" width="10" height="60" transform="rotate(8 183 235)"/>
          <rect x="195" y="205" width="10" height="60" transform="rotate(6 200 235)"/>
          <rect x="211" y="205" width="12" height="60" transform="rotate(4 216 235)"/>
        </g>
        <path d="${tailPath}" fill="none" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
      </g>`;
    };

    // 2. Oversized Purple Hoodie, Arms, Hands & Legs
    const renderBodyAndHoodie = () => {
      const breathSX = f(1 + pose.breath);
      const breathSY = f(1 - pose.breath * 0.45);
      const torsoTransform = tr(0, 0, 0, breathSX, breathSY, 120, 195);

      if (view === "bust") {
        // Bust purple hoodie with hood collar and drawstrings matching raccoon_expressions.jpg
        return `<g id="${uid}-bust-hoodie"${torsoTransform}>
          <path d="M 78 156 C 68 168, 63 180, 60 192 L 180 192 C 177 180, 172 168, 162 156 Z" fill="${hoodie}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Shoulder seams -->
          <path d="M 82 162 L 75 192 M 158 162 L 165 192" stroke="${line}" stroke-width="3" stroke-linecap="round"/>
          <!-- Bunched Hood Collar -->
          <path d="M 78 146 C 72 152, 74 163, 86 165 L 120 172 L 154 165 C 166 163, 168 152, 162 146 C 148 154, 92 154, 78 146 Z" fill="${hoodie}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
          <!-- Grey neck V-notch -->
          <polygon points="108,152 132,152 120,168" fill="${furMain}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
          <!-- Two Hoodie Drawstrings -->
          <rect x="107" y="166" width="4.2" height="20" rx="2" fill="${hoodieDark}" stroke="${line}" stroke-width="2.2"/>
          <rect x="128.8" y="166" width="4.2" height="20" rx="2" fill="${hoodieDark}" stroke="${line}" stroke-width="2.2"/>
        </g>`;
      }

      const ARM = { kind: "sleeve", color: hoodie, cuffColor: hoodieDark, pawColor: mask, width: 15, line };

      return `<g id="${uid}-full-body">
        <!-- Lower Pelvis & Short Grey Legs with Dark Feet -->
        <g id="${uid}-legs">
          <path d="M 84 224 C 84 246, 88 262, 92 268 L 84 270 C 78 272, 80 277, 88 277 L 111 277 C 115 277, 115 271, 113 266 L 115 246 L 125 246 L 127 266 C 125 271, 125 277, 129 277 L 152 277 C 160 277, 162 272, 156 270 L 148 268 C 152 262, 156 246, 156 224 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Pale lower belly crescent peeking under hoodie -->
          <path d="M 96 228 C 102 242, 138 242, 144 228 Z" fill="${furLight}" stroke="${line}" stroke-width="2.6"/>
          <!-- Dark Raccoon Feet -->
          <path d="M 91 264 L 113 264 C 115 270, 115 277, 111 277 L 88 277 C 80 277, 78 272, 84 270 Z" fill="${mask}" stroke="${line}" stroke-width="3.3" stroke-linejoin="round"/>
          <path d="M 149 264 L 127 264 C 125 270, 125 277, 129 277 L 152 277 C 160 277, 162 272, 156 270 Z" fill="${mask}" stroke="${line}" stroke-width="3.3" stroke-linejoin="round"/>
        </g>

        ${renderArms("raccoon", pose, ARM, "back", view, uid, 192, options.held)}

        <!-- Pear-shaped Purple Hoodie Torso -->
        <g id="${uid}-torso"${torsoTransform}>
          <path d="M 84 154 C 76 178, 72 206, 78 224 C 94 234, 146 234, 162 224 C 168 206, 164 178, 156 154 Z" fill="${hoodie}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Ribbed bottom hem -->
          <path d="M 78 220 C 96 230, 144 230, 162 220 L 160 227 C 144 236, 96 236, 80 227 Z" fill="${hoodieDark}" stroke="${line}" stroke-width="3.3" stroke-linejoin="round"/>
          <!-- Bunched Hood Collar -->
          <path d="M 78 146 C 72 152, 74 163, 86 165 L 120 172 L 154 165 C 166 163, 168 152, 162 146 C 148 154, 92 154, 78 146 Z" fill="${hoodie}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/>
          <polygon points="108,152 132,152 120,168" fill="${furMain}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M 86 158 Q 102 164 116 168 M 154 158 Q 138 164 124 168" fill="none" stroke="${hoodieLight}" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
        </g>
      </g>`;
    };

    // 3. Thinking Arm & Dark Raccoon Hand on Chin (matches raccoon_expressions.jpg Row 1 Col 3)

    // 4. Head, Rounded Ears with Pale Rims, Bandit Mask, Pale Brows & Muzzle
    const renderHead = () => {
      const headTransform = tr(pose.headX, pose.headY, pose.headRot, 1, 1, 120, 146);
      const earLRot = f(pose.earLRot - pose.earFlatten * 28);
      const earRRot = f(pose.earRRot + pose.earFlatten * 28);
      const earSY = f(1 - pose.earFlatten * 0.15);

      const muzzleX = f(pose.lookX * 3.0);
      const muzzleY = f(pose.lookY * 2.0);

      return `<g id="${uid}-head"${headTransform}>
        <!-- Left Rounded Ear with Pale Rim -->
        <g id="${uid}-earL"${tr(0, 0, earLRot, 1, earSY, 80, 68)}>
          <path d="M 63 82 C 52 60, 56 34, 72 28 C 86 24, 98 40, 100 62 Z" fill="${furLight}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 68 76 C 60 60, 63 40, 74 35 C 83 32, 91 44, 93 60 Z" fill="${mask}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
        </g>

        <!-- Right Rounded Ear with Pale Rim -->
        <g id="${uid}-earR"${tr(0, 0, earRRot, 1, earSY, 160, 68)}>
          <path d="M 177 82 C 188 60, 184 34, 168 28 C 154 24, 142 40, 140 62 Z" fill="${furLight}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M 172 76 C 180 60, 177 40, 166 35 C 157 32, 149 44, 147 60 Z" fill="${mask}" stroke="${line}" stroke-width="2.8" stroke-linejoin="round"/>
        </g>

        <!-- Wide Grey Head Base with Cheek Tufts & Top Hair Crest -->
        <path d="M 110 47 L 116 39 L 120 44 L 127 38 L 129 46 C 156 50, 174 70, 177 98 L 189 106 L 180 113 L 187 120 C 170 138, 148 149, 120 149 C 92 149, 70 138, 53 120 L 60 113 L 51 106 L 63 98 C 66 70, 84 50, 110 47 Z" fill="${furMain}" stroke="${line}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M 64 126 C 84 143, 156 143, 176 126 C 158 142, 140 148, 120 148 C 100 148, 82 142, 64 126 Z" fill="${furShadow}"/>

        <!-- Pale Brow Arches Above Mask -->
        <path d="M 68 92 C 74 76, 102 74, 112 88 C 100 84, 78 86, 68 92 Z" fill="${furLight}"/>
        <path d="M 172 92 C 166 76, 138 74, 128 88 C 140 84, 162 86, 172 92 Z" fill="${furLight}"/>

        <!-- Dark Bandit Mask Across Both Eyes -->
        <path d="M 64 102 C 66 84, 86 80, 108 90 C 115 93, 125 93, 132 90 C 154 80, 174 84, 176 102 C 178 118, 158 128, 136 121 C 126 118, 114 118, 104 121 C 82 128, 62 118, 64 102 Z" fill="${mask}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>

        <!-- Pale Rounded Muzzle -->
        <ellipse cx="${f(120 + muzzleX * 0.5)}" cy="${f(126 + muzzleY * 0.5)}" rx="26" ry="20" fill="${furLight}" stroke="${line}" stroke-width="2.6"/>

        <!-- Cheek Blush -->
        ${renderCheekBlush(pose, {
          leftX: 76,
          rightX: 164,
          y: 122,
          rx: 12,
          ry: 6,
          color: "#F26E84",
        })}

        <!-- Raccoon Eyes (slightly heavy-lidded in idle) -->
        ${renderEyes(
          pose,
          {
            leftX: 91,
            rightX: 149,
            y: 103,
            rx: 14.5,
            ry: 13.5,
            scleraColor: pal.eyes,
            irisColor: pal.pupils,
            pupilColor: pal.pupils,
            lidColor: furMain,
            lineColor: line,
            almond: false,
            irisRatio: 0.62,
            pupilRatio: 0.92,
            heartColor: "#F26B8A",
            heartStroke: line,
          },
          uid
        )}

        <!-- Expressive Brows -->
        ${renderBrows(pose, {
          leftX: 90,
          rightX: 150,
          y: 80,
          width: 24,
          thickness: 4.5,
          color: furLight,
          style: "arch",
          stroke: line,
        })}

        <!-- Muzzle Details: Nose & Mouth -->
        <g transform="translate(${muzzleX} ${muzzleY})">
          ${renderMouth(
            pose,
            {
              cx: 120,
              cy: 132,
              width: 22,
              lineColor: line,
              splitSmile: false,
              noseBottomY: 123,
            },
            uid
          )}
          <!-- Dark Oval Raccoon Nose -->
          <ellipse cx="120" cy="117" rx="9.5" ry="6.5" fill="${mask}" stroke="${line}" stroke-width="2.8"/>
          <ellipse cx="117.5" cy="115" rx="3" ry="1.4" fill="#FFFFFF" fill-opacity="0.45"/>
        </g>
      </g>`;
    };

    return `${renderShadow(view, shadow, pose.bodyScaleX)}
      <g id="${uid}-root"${rootTransform}>
        ${renderTail()}
        ${renderBodyAndHoodie()}
        ${renderArms("raccoon", pose, FRONT_ARM, "front", view, uid, 192, options.held)}
        ${renderHead()}
        ${renderArms("raccoon", pose, FRONT_ARM, "overHead", view, uid, 192, options.held)}
        ${renderLoveHearts(pose, timeMs, line)}
      </g>`;
  },
};
