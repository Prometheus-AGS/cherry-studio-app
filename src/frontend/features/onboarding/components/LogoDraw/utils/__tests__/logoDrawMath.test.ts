import { fmtPoint, segmentProgress } from '../logoDrawMath';
import {
  CROWN_NODES,
  CROWN_SPOKES,
  HEX_CENTER,
  HEX_FILL,
  HEX_VERTICES,
  SHADOW_NODES,
  SHADOW_SPOKES,
} from '../logoPaths';

describe('fmtPoint', () => {
  it('formats to at most 2 decimals, dropping trailing zeros', () => {
    expect(fmtPoint({ x: 24, y: 8 })).toBe('24 8');
    expect(fmtPoint({ x: 37.86, y: 16 })).toBe('37.86 16');
  });
});

describe('segmentProgress', () => {
  it('maps the segment linearly onto [0, 1]', () => {
    expect(segmentProgress(0.3, 0.3, 0.8)).toBe(0);
    expect(segmentProgress(0.55, 0.3, 0.8)).toBeCloseTo(0.5);
    expect(segmentProgress(0.8, 0.3, 0.8)).toBe(1);
  });

  it('clamps outside the segment, including spring overshoot past 1', () => {
    expect(segmentProgress(0.1, 0.3, 0.8)).toBe(0);
    expect(segmentProgress(0.95, 0.3, 0.8)).toBe(1);
    expect(segmentProgress(1.06, 0.92, 1)).toBe(1);
  });

  it('treats a degenerate segment as a step', () => {
    expect(segmentProgress(0.49, 0.5, 0.5)).toBe(0);
    expect(segmentProgress(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe('logo geometry', () => {
  // Guard the brand-source geometry: the hexagon closes on itself and every
  // spoke starts at the shared hub so the draw-on reveal starts and ends in
  // the right places.
  it('hexagon fill starts and ends at the top vertex (closed path)', () => {
    expect(HEX_FILL.startsWith(`M ${fmtPoint(HEX_VERTICES.top)}`)).toBe(true);
    expect(HEX_FILL.endsWith('Z')).toBe(true);
  });

  it('crown spokes all originate at the hub and end on a crown node', () => {
    const moves = CROWN_SPOKES.match(/M [\d.-]+ [\d.-]+/g) ?? [];
    expect(moves).toEqual(Array(3).fill(`M ${fmtPoint(HEX_CENTER)}`));
    for (const node of CROWN_NODES) {
      expect(CROWN_SPOKES).toContain(`L ${fmtPoint(node)}`);
    }
  });

  it('shadow spokes all originate at the hub and end on a shadow node', () => {
    const moves = SHADOW_SPOKES.match(/M [\d.-]+ [\d.-]+/g) ?? [];
    expect(moves).toEqual(Array(3).fill(`M ${fmtPoint(HEX_CENTER)}`));
    for (const node of SHADOW_NODES) {
      expect(SHADOW_SPOKES).toContain(`L ${fmtPoint(node)}`);
    }
  });

  it('contains no NaN coordinates', () => {
    for (const d of [HEX_FILL, CROWN_SPOKES, SHADOW_SPOKES]) {
      expect(d).not.toMatch(/NaN/);
    }
  });
});
