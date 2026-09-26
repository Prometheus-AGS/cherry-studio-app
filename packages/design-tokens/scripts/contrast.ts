/**
 * WCAG 2.2 AA contrast assertions for the resolved theme contract.
 *
 * Every pair is measured on the values the app actually renders: each role is
 * followed through its `var()` chain to a literal, translucent colours are
 * composited over the surface beneath them, and the result is compared with
 * the WCAG relative-luminance formula. Nothing here is a hand-copied number,
 * so a palette edit that breaks a pair fails the check that same run.
 *
 * Supported value grammar, which is everything the token sources author:
 * `oklch(L C H)` and `oklch(L C H / A)` with decimal lightness, `#rgb` and
 * `#rrggbb`, `color-mix(in srgb, <color> P%, <color>|transparent)`, and
 * `var(--name)`. Anything else throws, so an unparsable colour in a measured
 * role cannot silently pass.
 */

import { type Declaration, extractReferences } from './css-contract';

type Rgba = { a: number; b: number; g: number; r: number };

/** WCAG 2.2 SC 1.4.3 (text) and 1.4.11 (non-text UI and focus indicators). */
const TEXT_MINIMUM = 4.5;
const UI_MINIMUM = 3;

type ContrastPair = {
  /** The page the surface sits on, for translucent surfaces. */
  base?: string;
  foreground: string;
  kind: 'text' | 'ui';
  surface: string;
};

const textOn = (foreground: string, surfaces: string[]): ContrastPair[] =>
  surfaces.map((surface) => ({ foreground, kind: 'text', surface }));

const uiOn = (foreground: string, surfaces: string[]): ContrastPair[] =>
  surfaces.map((surface) => ({ foreground, kind: 'ui', surface }));

const SURFACES = ['background', 'card', 'popover', 'sidebar'];
const CONTENT_SURFACES = ['background', 'card', 'popover'];

/**
 * The asserted pairs. Text roles on every surface they can land on; solid
 * action fills with the text drawn on them; and the non-text roles a user must
 * see to find or operate a control, measured against the page.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { foreground: 'foreground', kind: 'text', surface: 'background' },
  { foreground: 'card-foreground', kind: 'text', surface: 'card' },
  { foreground: 'popover-foreground', kind: 'text', surface: 'popover' },
  { foreground: 'sidebar-foreground', kind: 'text', surface: 'sidebar' },
  ...textOn('muted-foreground', SURFACES),
  ...textOn('link', SURFACES),
  // Feedback roles are used as text (`text-error`, `text-success`, …).
  ...textOn('success', CONTENT_SURFACES),
  ...textOn('warning', CONTENT_SURFACES),
  ...textOn('info', CONTENT_SURFACES),
  ...textOn('error', CONTENT_SURFACES),
  {
    base: 'background',
    foreground: 'inline-code-foreground',
    kind: 'text',
    surface: 'inline-code',
  },
  { foreground: 'primary-foreground', kind: 'text', surface: 'primary' },
  { foreground: 'destructive-foreground', kind: 'text', surface: 'destructive' },
  { base: 'background', foreground: 'secondary-foreground', kind: 'text', surface: 'secondary' },
  { foreground: 'accent-foreground', kind: 'text', surface: 'accent' },
  ...uiOn('primary', ['background', 'card', 'popover']),
  ...uiOn('control-active', ['background']),
  ...uiOn('ring', ['background']),
  // `border` and `input` are deliberately not asserted. WCAG 2.2 SC 1.4.11
  // requires 3:1 only for visual information needed to identify a component:
  // `border` draws decorative separators, and inputs are identified by their
  // fill and visible label rather than the outline alone. Desktop v2.2 values
  // (1.26:1 light, 1.44:1 dark) are kept; see DEVIATIONS.md.
  // Verifier checks input boundaries on device.
];

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const COLOR_MIX = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+)\)$/;
const VAR = /^var\(\s*(--[a-z0-9-]+)\s*\)$/;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const encodeSrgb = (value: number) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
const decodeSrgb = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/** OKLCH → gamma-encoded sRGB (Björn Ottosson's reference matrices), clipped to gamut. */
function oklchToRgb(
  lightness: number,
  chroma: number,
  hueDegrees: number,
): [number, number, number] {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const [r, g, bl] = linear.map((channel) => encodeSrgb(clamp01(channel)));
  return [r, g, bl];
}

class ColorResolver {
  constructor(
    private readonly label: string,
    private readonly declarations: Map<string, Declaration>,
  ) {}

  resolve(name: string): Rgba {
    const declaration = this.declarations.get(`--${name}`);
    if (!declaration) {
      throw new Error(`[design-tokens] ${this.label} contrast pair names undeclared --${name}`);
    }
    return this.parse(declaration.value, `--${name}`);
  }

  private parse(value: string, context: string): Rgba {
    const text = value.trim();
    if (text === 'transparent') return { a: 0, b: 0, g: 0, r: 0 };

    const variable = VAR.exec(text);
    if (variable) {
      const target = this.declarations.get(variable[1]);
      if (!target)
        throw new Error(`[design-tokens] ${this.label} ${context} → missing ${variable[1]}`);
      return this.parse(target.value, variable[1]);
    }

    const oklch = OKLCH.exec(text);
    if (oklch) {
      const [r, g, b] = oklchToRgb(Number(oklch[1]), Number(oklch[2]), Number(oklch[3]));
      const alpha = oklch[4] === undefined ? 1 : Number(oklch[4]) / (oklch[5] ? 100 : 1);
      return { a: alpha, b, g, r };
    }

    const hex = HEX.exec(text);
    if (hex) {
      const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
      const channel = (index: number) => parseInt(digits.slice(index, index + 2), 16) / 255;
      return { a: 1, b: channel(4), g: channel(2), r: channel(0) };
    }

    const mix = COLOR_MIX.exec(text);
    if (mix) {
      // CSS Color 5 mixes in premultiplied alpha, so `transparent` fades the
      // first colour's alpha without dragging its channels toward black.
      const weight = Number(mix[2]) / 100;
      const first = this.parse(mix[1], context);
      const second = this.parse(mix[3], context);
      const alpha = first.a * weight + second.a * (1 - weight);
      if (alpha === 0) return { a: 0, b: 0, g: 0, r: 0 };
      const channel = (key: 'b' | 'g' | 'r') =>
        (first[key] * first.a * weight + second[key] * second.a * (1 - weight)) / alpha;
      return { a: alpha, b: channel('b'), g: channel('g'), r: channel('r') };
    }

    const unresolved = extractReferences(text);
    throw new Error(
      `[design-tokens] ${this.label} ${context} has an unmeasurable colour "${text}"${
        unresolved.length > 0 ? ` (references ${unresolved.join(', ')})` : ''
      }`,
    );
  }
}

function over(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top.a + bottom.a * (1 - top.a);
  if (alpha === 0) return { a: 0, b: 0, g: 0, r: 0 };
  const channel = (key: 'b' | 'g' | 'r') =>
    (top[key] * top.a + bottom[key] * bottom.a * (1 - top.a)) / alpha;
  return { a: alpha, b: channel('b'), g: channel('g'), r: channel('r') };
}

function luminance({ b, g, r }: Rgba): number {
  return 0.2126 * decodeSrgb(r) + 0.7152 * decodeSrgb(g) + 0.0722 * decodeSrgb(b);
}

export function contrastRatio(first: Rgba, second: Rgba): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export type ContrastResult = ContrastPair & { minimum: number; ratio: number; theme: string };

export function measureContrast(
  theme: string,
  declarations: Map<string, Declaration>,
): ContrastResult[] {
  const resolver = new ColorResolver(theme, declarations);
  const page = resolver.resolve('background');
  if (page.a < 1) {
    throw new Error(`[design-tokens] ${theme} --background must be opaque to measure contrast`);
  }

  return CONTRAST_PAIRS.map((pair) => {
    const base = pair.base ? over(resolver.resolve(pair.base), page) : page;
    const surface = over(resolver.resolve(pair.surface), base);
    const foreground = over(resolver.resolve(pair.foreground), surface);
    return {
      ...pair,
      minimum: pair.kind === 'text' ? TEXT_MINIMUM : UI_MINIMUM,
      ratio: contrastRatio(foreground, surface),
      theme,
    };
  });
}

/** Throws once, listing every failing pair across both themes. */
export function assertContrast(results: readonly ContrastResult[]): void {
  const failures = results.filter(({ minimum, ratio }) => ratio < minimum);
  if (failures.length === 0) return;

  const lines = failures.map(
    ({ foreground, kind, minimum, ratio, surface, theme }) =>
      `  ${theme.padEnd(5)} ${kind.padEnd(4)} --${foreground} on --${surface}: ${ratio.toFixed(2)}:1 (needs ${minimum}:1)`,
  );
  throw new Error(
    `[design-tokens] ${failures.length} WCAG 2.2 AA contrast pair(s) below minimum:\n${lines.join('\n')}`,
  );
}
