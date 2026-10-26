import type { CSSProperties, ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from "react";
import type { Amplitude, CritterCharacter, CritterExpression, CritterProp, CritterView } from "./vanilla";

export * from "./vanilla";

export interface CritterHeadProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  character?: CritterCharacter;
  expression?: CritterExpression;
  view?: CritterView;
  size?: number;
  palette?: Record<string, string>;
  speed?: number;
  paused?: boolean;
  /** follow the pointer, hop and spin on a click (default true) */
  interactive?: boolean;
  accessory?: boolean;
  prop?: CritterProp | null;
  shadow?: boolean;
  floorShadow?: boolean;
  seed?: number;
  transitionMs?: number;
  lookAt?: { x: number; y: number };
  amplitude?: Amplitude;
  /** start the clock here (e.g. a paused thumbnail showing a representative pose) */
  startMs?: number;
  style?: CSSProperties;
}

export interface CritterHeadHandle {
  readonly element: HTMLSpanElement | null;
  seek(ms: number): void;
  setExpression(expression: CritterExpression): void;
  react(durationMs?: number): void;
  lookAt(x: number, y: number, options?: { smooth?: boolean }): void;
  setAmplitude(amplitude: Amplitude): void;
  toSVG(ms?: number): string;
}

export const CritterHead: ForwardRefExoticComponent<CritterHeadProps & RefAttributes<CritterHeadHandle>>;
export default CritterHead;
