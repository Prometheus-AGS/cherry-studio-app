import { fmtPoint, type Point } from './logoDrawMath';

/**
 * Logo geometry for The Boss mark: a hexagon with six spokes radiating from
 * a center hub to six corner nodes. Coordinates are copied verbatim from the
 * brand SVG source (`assets/branding/source/icon-light.svg`, viewBox
 * `0 0 48 48`) — see `openspec/changes/rebrand-003-visual-assets`.
 *
 * The three "crown" spokes/nodes (top, upper-right, upper-left) render
 * white; the three "shadow" spokes/nodes (lower-right, bottom, lower-left)
 * render dark with an ember-ringed node, matching the source mark's
 * light-on-top / dark-on-bottom shading.
 */

/** Center hub position. */
export const HEX_CENTER: Point = { x: 24, y: 24 };

/** Hexagon vertices, in source-SVG order starting at the top. */
export const HEX_VERTICES = {
  top: { x: 24, y: 8 },
  upperRight: { x: 37.86, y: 16 },
  lowerRight: { x: 37.86, y: 32 },
  bottom: { x: 24, y: 40 },
  lowerLeft: { x: 10.14, y: 32 },
  upperLeft: { x: 10.14, y: 16 },
} as const satisfies Record<string, Point>;

/** Hexagon fill (the source SVG's `polygon`), revealed as a group fade-in. */
export const HEX_FILL = `M ${fmtPoint(HEX_VERTICES.top)} L ${fmtPoint(HEX_VERTICES.upperRight)} L ${fmtPoint(HEX_VERTICES.lowerRight)} L ${fmtPoint(HEX_VERTICES.bottom)} L ${fmtPoint(HEX_VERTICES.lowerLeft)} L ${fmtPoint(HEX_VERTICES.upperLeft)} Z`;

function spokePath(vertex: Point): string {
  return `M ${fmtPoint(HEX_CENTER)} L ${fmtPoint(vertex)}`;
}

/**
 * Top three spokes ("active crown"), one combined path so a single `end`
 * trim draws them in source order: top, upper-right, upper-left.
 */
export const CROWN_SPOKES = [
  spokePath(HEX_VERTICES.top),
  spokePath(HEX_VERTICES.upperRight),
  spokePath(HEX_VERTICES.upperLeft),
].join(' ');

/**
 * Bottom three spokes ("shadow"), same construction: lower-right, bottom,
 * lower-left.
 */
export const SHADOW_SPOKES = [
  spokePath(HEX_VERTICES.lowerRight),
  spokePath(HEX_VERTICES.bottom),
  spokePath(HEX_VERTICES.lowerLeft),
].join(' ');

/** Corner nodes that light up as their spoke draws, grouped by tone. */
export const CROWN_NODES: readonly Point[] = [
  HEX_VERTICES.top,
  HEX_VERTICES.upperRight,
  HEX_VERTICES.upperLeft,
];
export const SHADOW_NODES: readonly Point[] = [
  HEX_VERTICES.lowerRight,
  HEX_VERTICES.bottom,
  HEX_VERTICES.lowerLeft,
];
