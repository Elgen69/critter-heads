export type CritterCharacter = "fox" | "owl" | "cat" | "raccoon" | "panda" | "dog" | "bunny" | "bear" | "frog" | "otter";
export type CritterExpression =
  | "idle" | "happy" | "thinking" | "searching" | "listening" | "speaking"
  | "working" | "surprised" | "upset" | "sad" | "sleeping" | "love";
export type CritterView = "bust" | "full";
export type CritterProp = "coffee" | "phone" | "laptop";
export type Beat = [ms: number, expression: CritterExpression, options?: { transitionMs?: number }];
export type Amplitude = number[] | ((tMs: number) => number);

export interface CritterOptions {
  character?: CritterCharacter;
  expression?: CritterExpression;
  view?: CritterView;
  /** CSS px width of the character's box (full view is 1.25x as tall). */
  size?: number;
  /** Override any palette key of the character (see characters[id].defaultPalette). */
  palette?: Record<string, string>;
  seed?: number | string;
  speed?: number;
  transitionMs?: number;
  /** false: nothing moves until you call seek(ms). For frame-exact playback. */
  autoplay?: boolean;
  /** hold the current pose */
  paused?: boolean;
  shadow?: boolean;
  /** the signature accessory (scarf, glasses, collar, bamboo sprout) */
  accessory?: boolean;
  /** something to hold: changes how the critter acts (sips, scrolls, types) */
  prop?: CritterProp | null;
  beats?: Beat[];
  lookAt?: { x: number; y: number };
  amplitude?: Amplitude;
  ariaLabel?: string;
  startMs?: number;
}

export interface CritterInstance {
  seek(ms: number): CritterInstance;
  setExpression(expression: CritterExpression, options?: { transitionMs?: number }): CritterInstance;
  /** hop + spin + happy face */
  react(durationMs?: number): CritterInstance;
  lookAt(x: number, y: number, options?: { smooth?: boolean }): CritterInstance;
  setAmplitude(amplitude: Amplitude): CritterInstance;
  update(partial: CritterOptions): CritterInstance;
  readonly bounds: { width: number; height: number };
  readonly element: SVGSVGElement | null;
  readonly expression: CritterExpression;
  getTime(): number;
  toSVG(ms?: number): string;
  destroy(): void;
}

export interface CharacterDefinition {
  id: CritterCharacter;
  name: string;
  species: string;
  role: string;
  defaultPalette: Record<string, string>;
}

export const characters: Record<CritterCharacter, CharacterDefinition>;
export const CHARACTER_IDS: CritterCharacter[];
export const EXPRESSIONS: CritterExpression[];
export const critterCharacters: CritterCharacter[];
export const critterExpressions: CritterExpression[];
export const critterProps: CritterProp[];
export const DESCRIPTIONS: Record<CritterCharacter, Record<CritterExpression, string>>;
export function describe(character: CritterCharacter, expression: CritterExpression): string;
export function createCritter(container: Element | null, options?: CritterOptions): CritterInstance;
export function renderCritterSVGMarkup(config: CritterOptions, timeMs?: number): { outer: string; inner: string; viewBox: string; bounds: { width: number; height: number } };
export function defineCritterElement(tagName?: string): CustomElementConstructor | undefined;
