/**
 * Brand colors for the animated logo, copied verbatim from the brand SVG
 * source (`assets/branding/source/icon-light.svg`). These are fixed
 * brand-asset colors and intentionally do not follow the app theme — the
 * logo reads the same in light and dark mode.
 */
export const logoBrandColors = {
  /** Hexagon fill. */
  hex: '#E04E28',
  /** Top three ("active crown") spokes and nodes. */
  crown: '#FFFFFF',
  /** Bottom three ("shadow") spokes and node fills; also the node ring color's base. */
  shadow: '#0B0F14',
  /** Shadow node ring stroke. */
  shadowRing: '#E04E28',
  /** Center hub — the landing dot. */
  hub: '#FFFFFF',
} as const;
