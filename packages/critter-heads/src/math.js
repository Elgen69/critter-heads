// Pure math: easing, seeded PRNG (mulberry32), seeded blinks / micro-motion, speech amplitude.
// Everything here is a pure function of its inputs (no clocks, no unseeded randomness).

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeInOutCubic(t) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutBack(t) {
  const x = clamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Deterministic 32-bit integer seed converter
export function seedToUint32(seed = 0.42) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const n = Math.floor(Math.abs(seed) * 2147483647) || 1;
    return (n ^ 0x9e3779b9) >>> 0;
  }
  const str = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

// Mulberry32 deterministic PRNG
export function mulberry32(a) {
  let state = a >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sample a deterministic random value for a given time bucket and channel
export function sampleBucket(seedUint, bucketIndex, channel = 0) {
  const mixed =
    (seedUint ^
      Math.imul(bucketIndex + 101, 0x9e3779b9) ^
      Math.imul(channel + 17, 0x85ebca6b)) >>>
    0;
  return mulberry32(mixed)();
}

// Deterministic blink curve as a pure function of time t (ms) and seed
export function evalSeededBlink(t, seedUint) {
  const windowMs = 2200;
  const bucket = Math.floor(t / windowMs);
  const r1 = sampleBucket(seedUint, bucket, 1);
  const r2 = sampleBucket(seedUint, bucket, 2);
  // Blink occurs in ~78% of windows at a seeded offset within the window
  if (r1 > 0.78) return 0;
  const blinkStart = (0.18 + r2 * 0.64) * windowMs;
  const localT = t - bucket * windowMs - blinkStart;
  const duration = 170;
  if (localT < 0 || localT > duration) return 0;
  const phase = localT / duration;
  return Math.sin(phase * Math.PI);
}

// Deterministic ear twitch and micro-glance as pure functions of time t (ms) and seed
export function evalSeededMicroMotion(t, seedUint) {
  const earWindow = 1800;
  const earBucket = Math.floor(t / earWindow);
  const er1 = sampleBucket(seedUint, earBucket, 3);
  const er2 = sampleBucket(seedUint, earBucket, 4);
  let earTwitchL = 0;
  let earTwitchR = 0;
  if (er1 < 0.55) {
    const start = (0.2 + er2 * 0.55) * earWindow;
    const dt = t - earBucket * earWindow - start;
    if (dt >= 0 && dt <= 220) {
      const pulse = Math.sin((dt / 220) * Math.PI * 2) * Math.exp(-dt / 120);
      if (er1 < 0.27) earTwitchL = pulse * 8;
      else earTwitchR = -pulse * 8;
    }
  }

  const glanceWindow = 3200;
  const glanceBucket = Math.floor(t / glanceWindow);
  const gr1 = sampleBucket(seedUint, glanceBucket, 5);
  const gr2 = sampleBucket(seedUint, glanceBucket, 6);
  const nextGr1 = sampleBucket(seedUint, glanceBucket + 1, 5);
  const nextGr2 = sampleBucket(seedUint, glanceBucket + 1, 6);
  const gPhase = easeInOutCubic((t - glanceBucket * glanceWindow) / glanceWindow);
  const gx0 = gr1 < 0.45 ? (gr2 - 0.5) * 0.26 : 0;
  const gx1 = nextGr1 < 0.45 ? (nextGr2 - 0.5) * 0.26 : 0;
  const gy0 = gr1 < 0.45 ? (er2 - 0.5) * 0.14 : 0;
  const gy1 = nextGr1 < 0.45 ? (er1 - 0.5) * 0.14 : 0;

  return {
    earTwitchL,
    earTwitchR,
    glanceX: lerp(gx0, gx1, gPhase),
    glanceY: lerp(gy0, gy1, gPhase),
  };
}

// Evaluate speaking amplitude at time t (ms)
export function evalAmplitude(amplitudeSource, t) {
  if (typeof amplitudeSource === "function") {
    const v = Number(amplitudeSource(t));
    return Number.isFinite(v) ? clamp(v, 0, 1) : 0;
  }
  if (Array.isArray(amplitudeSource) && amplitudeSource.length > 0) {
    // 60 Hz sample array
    const exactIdx = (Math.max(0, t) / 1000) * 60;
    const i0 = Math.floor(exactIdx) % amplitudeSource.length;
    const i1 = (i0 + 1) % amplitudeSource.length;
    const frac = exactIdx - Math.floor(exactIdx);
    const v0 = clamp(Number(amplitudeSource[i0]) || 0, 0, 1);
    const v1 = clamp(Number(amplitudeSource[i1]) || 0, 0, 1);
    return lerp(v0, v1, frac);
  }
  // Default natural deterministic speech cadence when no external amplitude is supplied
  const s = t / 1000;
  const syllable =
    0.5 +
    0.35 * Math.sin(s * 17.5) +
    0.25 * Math.sin(s * 29.0 + 1.1) +
    0.2 * Math.cos(s * 11.2 + 0.4);
  const pauseGate = Math.sin(s * 3.4) > -0.65 ? 1 : 0.15;
  return clamp(syllable * pauseGate, 0.08, 0.96);
}
