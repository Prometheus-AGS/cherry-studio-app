/**
 * Pure geometry helpers for the logo draw animation. No Skia or React
 * dependencies so everything here is unit-testable in plain jest.
 */

export type Point = { x: number; y: number };

const fmt = (n: number): string => String(Number(n.toFixed(2)));

/** `x y` pair formatted for an SVG path string. */
export function fmtPoint(p: Point): string {
  return `${fmt(p.x)} ${fmt(p.y)}`;
}

/**
 * Maps master progress onto a [from, to] sub-segment, clamped to [0, 1].
 * Runs inside useDerivedValue, hence the worklet directive. A degenerate
 * segment (to <= from) acts as a step at `to`.
 */
export function segmentProgress(progress: number, from: number, to: number): number {
  'worklet';
  if (to <= from) {
    return progress >= to ? 1 : 0;
  }
  const t = (progress - from) / (to - from);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
