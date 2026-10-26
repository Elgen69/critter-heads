// critter-heads core (framework-free): createCritter, <critter-head> custom element, character data.
// React users: import { CritterHead } from "critter-heads". This file is "critter-heads/vanilla".

import { EXPRESSIONS, CHARACTER_IDS, clamp, seedToUint32, normalizeBeats, evaluateRigAtTime } from "./rig.js";
import { characters, fox, owl, cat, raccoon, panda, dog, bunny, bear, frog, otter } from "./characters/index.js";
import { DESCRIPTIONS, describe } from "./descriptions.js";
import { PROPS } from "./props.js";

export { characters, fox, owl, cat, raccoon, panda, dog, bunny, bear, frog, otter, EXPRESSIONS, CHARACTER_IDS, DESCRIPTIONS, describe };
export const critterCharacters = CHARACTER_IDS;
export const critterExpressions = EXPRESSIONS;
export const critterProps = PROPS;

function computeBounds(size, view) {
  const w = Math.max(16, Number(size) || 360);
  return { width: w, height: view === "full" ? Math.round(w * 1.25) : w };
}

function getViewBox(view) {
  return view === "full" ? "0 0 240 300" : "25 14 190 190";
}

function resolveCharacter(charOption) {
  if (charOption && typeof charOption === "object" && typeof charOption.render === "function") return charOption;
  const key = String(charOption || "fox").toLowerCase();
  return characters[key] || characters.fox;
}

export function renderCritterSVGMarkup(config, timeMs = 0) {
  const charDef = resolveCharacter(config.character);
  const view = config.view === "full" ? "full" : "bust";
  const bounds = computeBounds(config.size, view);
  const viewBox = getViewBox(view);
  const uid = config.uid || `cr-${charDef.id}-${view}-${(seedToUint32(config.seed) % 99991).toString(36)}`;

  const state = evaluateRigAtTime(timeMs, {
    characterId: charDef.id,
    beats: config.beats,
    transitionMs: config.transitionMs,
    seed: config.seed,
    amplitude: config.amplitude,
    lookAt: config.lookAt,
    reaction: config.reaction,
    prop: config.prop,
  });

  const inner = charDef.render(state, {
    view,
    shadow: config.shadow !== false,
    accessory: config.accessory !== false,
    palette: config.palette || {},
    held: config.prop ? { prop: config.prop, t: timeMs } : null,
    uid,
  });

  return {
    inner,
    viewBox,
    bounds,
    state,
    outer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${bounds.width}" height="${bounds.height}" style="display:block;overflow:visible;background:transparent;" data-character="${charDef.id}" data-view="${view}" data-expression="${state.activeExpression}">${inner}</svg>`,
  };
}

// ---------- one shared animation loop for every critter on the page ----------
// rAF already sleeps in hidden tabs, so a hidden page costs nothing.
const ticker = { subs: new Set(), id: null, last: null };
function frame(ts) {
  const dt = ticker.last === null ? 0 : Math.min(100, Math.max(0, ts - ticker.last));
  ticker.last = ts;
  for (const fn of ticker.subs) fn(dt);
  if (ticker.subs.size) ticker.id = requestAnimationFrame(frame);
  else { ticker.id = null; ticker.last = null; }
}
function subscribe(fn) {
  ticker.subs.add(fn);
  if (ticker.id === null && typeof requestAnimationFrame === "function") {
    ticker.last = null;
    ticker.id = requestAnimationFrame(frame);
  }
  return () => ticker.subs.delete(fn);
}

function prefersReducedMotion() {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

let instanceCount = 0;

export function createCritter(container, initialOptions = {}) {
  const o = initialOptions;
  const config = {
    character: o.character || "fox",
    view: o.view === "full" ? "full" : "bust",
    size: Number(o.size) || 360,
    palette: { ...(o.palette || {}) },
    seed: o.seed !== undefined ? o.seed : 0.42,
    speed: o.speed !== undefined ? Number(o.speed) : 1,
    transitionMs: o.transitionMs !== undefined ? Number(o.transitionMs) : 300,
    autoplay: o.autoplay !== undefined ? Boolean(o.autoplay) : true,
    paused: Boolean(o.paused),
    shadow: o.shadow !== undefined ? Boolean(o.shadow) : true,
    accessory: o.accessory !== undefined ? Boolean(o.accessory) : true,
    prop: PROPS.includes(o.prop) ? o.prop : null,
    beats: normalizeBeats(o.beats || (o.expression ? [[0, o.expression]] : [[0, "idle"]])),
    lookAt: { x: clamp(Number(o.lookAt?.x) || 0, -1, 1), y: clamp(Number(o.lookAt?.y) || 0, -1, 1) },
    amplitude: o.amplitude || null,
    reaction: null,
    lookTarget: null,
    uid: `cr${++instanceCount}`,
  };

  let currentTimeMs = Number(o.startMs) || 0;
  let destroyed = false;
  let unsubscribe = null;
  let svgEl = null;
  let lastInner = "";
  const lastAttrs = {}; // only touch the DOM when something actually changed
  const setAttr = (name, value) => {
    if (lastAttrs[name] !== value) {
      lastAttrs[name] = value;
      svgEl.setAttribute(name, value);
    }
  };
  const reducedMotion = prefersReducedMotion();

  if (container && typeof document !== "undefined") {
    svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgEl.setAttribute("role", "img");
    svgEl.style.display = "block";
    svgEl.style.overflow = "visible";
    svgEl.style.background = "transparent";
    container.appendChild(svgEl);
  }

  function renderAt(tMs) {
    if (destroyed) return undefined;
    const res = renderCritterSVGMarkup(config, tMs);
    if (svgEl) {
      const charDef = resolveCharacter(config.character);
      setAttr("viewBox", res.viewBox);
      setAttr("width", String(res.bounds.width));
      setAttr("height", String(res.bounds.height));
      setAttr("data-expression", res.state.activeExpression);
      setAttr("aria-label", o.ariaLabel || `${charDef.name} the ${charDef.species}, ${res.state.activeExpression}`);
      if (res.inner !== lastInner) {
        svgEl.innerHTML = res.inner;
        lastInner = res.inner;
      }
    }
    return res;
  }

  function onTick(dt) {
    if (destroyed) return;
    const still = config.paused || reducedMotion;
    // a paused critter with nothing easing has nothing new to draw: skip the frame entirely
    // (explicit calls like setExpression / update / seek still render immediately)
    if (still && !config.lookTarget) return;
    if (!still) currentTimeMs += dt * config.speed;
    if (config.lookTarget) {
      // ease the gaze toward the pointer instead of snapping
      const k = 1 - Math.exp(-dt / 110);
      config.lookAt = {
        x: config.lookAt.x + (config.lookTarget.x - config.lookAt.x) * k,
        y: config.lookAt.y + (config.lookTarget.y - config.lookAt.y) * k,
      };
      if (still && Math.abs(config.lookAt.x - config.lookTarget.x) + Math.abs(config.lookAt.y - config.lookTarget.y) < 0.002) {
        config.lookAt = config.lookTarget;
        config.lookTarget = null; // arrived: stop drawing until something changes
      }
    }
    renderAt(currentTimeMs);
  }

  function startLoop() {
    if (destroyed || unsubscribe || !config.autoplay) return;
    unsubscribe = subscribe(onTick);
  }
  function stopLoop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
  }

  renderAt(currentTimeMs);
  if (config.autoplay) startLoop();

  const api = {
    seek(ms) {
      currentTimeMs = Math.max(0, Number(ms) || 0);
      renderAt(currentTimeMs);
      return api;
    },

    // Live use: switch expression now; the face and body blend over transitionMs.
    setExpression(expression, options = {}) {
      if (!EXPRESSIONS.includes(expression)) return api;
      const kept = config.beats.filter((b) => b.ms < currentTimeMs);
      // drop beats older than the one still blending, so long sessions stay small
      while (kept.length > 2) kept.shift();
      kept.push({ ms: currentTimeMs, expression, options: options || {} });
      config.beats = normalizeBeats(kept);
      renderAt(currentTimeMs);
      return api;
    },

    // Click reaction: a hop with a spin and a happy face.
    react(durationMs = 950) {
      config.reaction = { at: currentTimeMs, durationMs };
      renderAt(currentTimeMs);
      return api;
    },

    // lookAt(x, y) snaps; lookAt(x, y, { smooth: true }) eases there (pointer following).
    lookAt(x = 0, y = 0, opts = {}) {
      const target = { x: clamp(Number(x) || 0, -1, 1), y: clamp(Number(y) || 0, -1, 1) };
      if (opts && opts.smooth) {
        config.lookTarget = target;
      } else {
        config.lookTarget = null;
        config.lookAt = target;
        renderAt(currentTimeMs);
      }
      return api;
    },

    setAmplitude(arrOrFn) {
      config.amplitude = arrOrFn;
      return api;
    },

    update(partial = {}) {
      if (!partial || typeof partial !== "object") return api;
      if (partial.character !== undefined) config.character = partial.character;
      if (partial.view !== undefined) config.view = partial.view === "full" ? "full" : "bust";
      if (partial.size !== undefined) config.size = Number(partial.size) || 360;
      if (partial.palette !== undefined) config.palette = { ...(partial.palette || {}) };
      if (partial.seed !== undefined) config.seed = partial.seed;
      if (partial.speed !== undefined) config.speed = Number(partial.speed);
      if (partial.transitionMs !== undefined) config.transitionMs = Number(partial.transitionMs);
      if (partial.shadow !== undefined) config.shadow = Boolean(partial.shadow);
      if (partial.accessory !== undefined) config.accessory = Boolean(partial.accessory);
      if (partial.prop !== undefined) config.prop = PROPS.includes(partial.prop) ? partial.prop : null;
      if (partial.paused !== undefined) config.paused = Boolean(partial.paused);
      if (partial.beats !== undefined) config.beats = normalizeBeats(partial.beats);
      else if (partial.expression !== undefined) api.setExpression(partial.expression);
      if (partial.lookAt !== undefined) api.lookAt(partial.lookAt?.x, partial.lookAt?.y);
      if (partial.amplitude !== undefined) config.amplitude = partial.amplitude;
      if (partial.autoplay !== undefined && Boolean(partial.autoplay) !== config.autoplay) {
        config.autoplay = Boolean(partial.autoplay);
        if (config.autoplay) startLoop();
        else stopLoop();
      }
      renderAt(currentTimeMs);
      return api;
    },

    get bounds() {
      return computeBounds(config.size, config.view);
    },
    get element() {
      return svgEl;
    },
    get expression() {
      return config.beats[config.beats.length - 1].expression;
    },
    getTime() {
      return currentTimeMs;
    },
    getConfig() {
      const charDef = resolveCharacter(config.character);
      return { ...config, character: charDef.id, defaultPalette: { ...charDef.defaultPalette }, effectivePalette: { ...charDef.defaultPalette, ...config.palette } };
    },
    toSVG(ms) {
      const t = ms !== undefined ? Math.max(0, Number(ms) || 0) : currentTimeMs;
      return renderCritterSVGMarkup(config, t).outer;
    },
    destroy() {
      destroyed = true;
      stopLoop();
      if (svgEl && svgEl.parentNode) svgEl.parentNode.removeChild(svgEl);
      svgEl = null;
    },
  };

  return api;
}

// ---------- <critter-head> custom element ----------
export function defineCritterElement(tagName = "critter-head") {
  if (typeof customElements === "undefined" || typeof HTMLElement === "undefined") return undefined;
  if (customElements.get(tagName)) return customElements.get(tagName);

  const ATTRS = ["character", "view", "size", "palette", "seed", "speed", "transition-ms", "autoplay", "paused", "shadow", "accessory", "beats", "expression", "prop"];
  const bool = (el, name, dflt) => (el.hasAttribute(name) ? !["false", "0"].includes(el.getAttribute(name)) : dflt);

  class CritterHeadElement extends HTMLElement {
    static get observedAttributes() {
      return ATTRS;
    }
    connectedCallback() {
      if (!this.style.display) this.style.display = "inline-block";
      if (!this._instance) this._instance = createCritter(this, this._read());
    }
    disconnectedCallback() {
      if (this._instance) this._instance.destroy();
      this._instance = null;
    }
    attributeChangedCallback() {
      if (this._instance) this._instance.update(this._read());
    }
    _read() {
      const opts = {};
      for (const k of ["character", "view", "expression", "prop"]) if (this.hasAttribute(k)) opts[k] = this.getAttribute(k);
      if (this.hasAttribute("size")) opts.size = Number(this.getAttribute("size")) || 360;
      if (this.hasAttribute("speed")) opts.speed = Number(this.getAttribute("speed")) || 1;
      if (this.hasAttribute("transition-ms")) opts.transitionMs = Number(this.getAttribute("transition-ms")) || 300;
      if (this.hasAttribute("seed")) {
        const raw = this.getAttribute("seed");
        opts.seed = Number.isFinite(Number(raw)) ? Number(raw) : raw;
      }
      opts.autoplay = bool(this, "autoplay", true);
      opts.paused = bool(this, "paused", false);
      opts.shadow = bool(this, "shadow", true);
      opts.accessory = bool(this, "accessory", true);
      for (const k of ["palette", "beats"]) {
        if (this.hasAttribute(k)) {
          try { opts[k] = JSON.parse(this.getAttribute(k)); } catch { /* ignore bad JSON */ }
        }
      }
      return opts;
    }
    seek(ms) { return this._instance?.seek(ms); }
    setExpression(e, opts) { return this._instance?.setExpression(e, opts); }
    react(d) { return this._instance?.react(d); }
    lookAt(x, y) { return this._instance?.lookAt(x, y); }
    setAmplitude(a) { return this._instance?.setAmplitude(a); }
    update(p) { return this._instance?.update(p); }
    toSVG(ms) { return this._instance ? this._instance.toSVG(ms) : ""; }
    get bounds() { return this._instance ? this._instance.bounds : { width: 0, height: 0 }; }
  }

  customElements.define(tagName, CritterHeadElement);
  return CritterHeadElement;
}
