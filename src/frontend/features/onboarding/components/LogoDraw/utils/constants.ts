import { Easing } from 'react-native-reanimated';

/**
 * Tuning constants for the logo draw animation. The mark geometry itself
 * lives in `logoPaths.ts`; the values here are stroke widths, node radii,
 * the master-progress timeline, and the reanimated configs.
 */

/**
 * Logo bounds in source-SVG user units (viewBox `0 0 48 48`). The mark's
 * ink — hexagon, spokes, nodes, and hub — sits well inside those bounds
 * with margin on every side, so no inset is needed.
 */
export const LOGO_VIEWBOX_WIDTH = 48;
export const LOGO_VIEWBOX_HEIGHT = 48;

/** Width-over-height aspect ratio of the logo drawing area (square mark). */
export const LOGO_ASPECT_RATIO = LOGO_VIEWBOX_WIDTH / LOGO_VIEWBOX_HEIGHT;

/** Spoke stroke width in viewBox units, matching the source SVG's lines. */
export const SPOKE_STROKE_WIDTH = 1.5;

/** Corner node radii, matching the source SVG's circles. */
export const CROWN_NODE_RADIUS = 2.75;
export const SHADOW_NODE_RADIUS = 2.25;
export const SHADOW_NODE_RING_WIDTH = 1.5;

/** Center hub radius, matching the source SVG's circle. */
export const HUB_RADIUS = 3;

/**
 * Master-progress sub-segments. The six spokes draw as one continuous
 * gesture (crown then shadow), the hexagon fill settles in next, and the
 * center hub lands last. The gaps before the hexagon and the hub are
 * deliberate beats.
 */
export const LOGO_DRAW_SEGMENTS = {
  crownSpokes: { from: 0, to: 0.3 },
  shadowSpokes: { from: 0.3, to: 0.6 },
  hexagon: { from: 0.66, to: 0.86 },
  hub: { from: 0.92, to: 1 },
} as const;

/** Timing for the drawing phase: progress 0 → hub.from, ease-in-out. */
export const logoDrawTiming = {
  duration: 1300,
  easing: Easing.inOut(Easing.cubic),
} as const;

/**
 * Spring that lands the center hub. Its overshoot past progress=1 is safe:
 * every trim interpolation clamps, and the hub scale consumes the
 * overshoot as a small rebound instead.
 */
export const hubSpringConfig = {
  damping: 14,
  stiffness: 180,
} as const;

/** Peak extra scale the hub reaches while the spring overshoots. */
export const HUB_OVERSHOOT_SCALE = 1.15;

/** Progress overshoot (past 1) that maps onto the peak hub scale. */
export const HUB_OVERSHOOT_RANGE = 0.06;
