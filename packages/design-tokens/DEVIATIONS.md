# Deviations from The Boss desktop Brand Guide v2.2

Mobile ports the desktop v2.2 colour and radius tokens (`the-boss`
`packages/ui/src/styles/tokens/colors/{primitive,providers,status-legacy}.css`,
`product.css`, `shadcn.css`) with the oklch values unchanged, except where
listed below. Every deviation reuses a step from the same desktop ramp; none
introduces a new colour. The reason in every case is WCAG 2.2 AA, which
`pnpm design:check` asserts on the resolved values (`scripts/contrast.ts`).

Contrast ratios are measured on the resolved tokens: light page `#F7F7F8`
(`oklch(0.9764 0.0013 286.4)`), card and popover white; dark page `#0B0F14`.
The text minimum is 4.5:1 (SC 1.4.3). The UI and focus minimum is 3:1
(SC 1.4.11).

| Role | Theme | Desktop v2.2 | Mobile | Contrast desktop → mobile | Reason |
|---|---|---|---|---|---|
| `--primary` | light | `brand-500` `oklch(0.6196 0.1888 35.2)` #E04E28 | `brand-600` `oklch(0.55 0.185 35.2)` | `primary-foreground` on it: 3.80 → 5.08 | Button text failed 4.5:1. Dark keeps `brand-400`. The logo colour `--brand` stays `brand-500` in both themes. `--ring` and `--control-active` follow primary. |
| `--destructive` | both | `red-500` `oklch(0.64 0.208 25)` | `red-600` `oklch(0.58 0.214 27)` | white on it: 3.72 → 4.77 | Button text failed 4.5:1. `--destructive-foreground` is unchanged (white). |
| `--ring` | light / dark | `color-mix(primary 40% / 45%, transparent)` | `var(--primary)` (solid) | on page: 1.68 → 4.95 (light), 2.20 → 6.75 (dark) | The focus indicator failed 3:1. |
| `--success` | light | `green-500` `oklch(0.72 0.192 149)` | `green-700` `oklch(0.52 0.137 150)` | on page: 2.15 → 4.83 (card 5.17) | Mobile renders feedback roles as text. Dark keeps `green-400` (11.02). |
| `--warning` | light | `amber-500` `oklch(0.77 0.165 71)` | `amber-700` `oklch(0.55 0.145 49)` | on page: 1.99 → 4.80 (card 5.13) | As above. Dark keeps `amber-400` (11.25). |
| `--info` | light | `blue-500` `oklch(0.63 0.186 260)` | `blue-600` `oklch(0.54 0.215 263)` | on page: 3.34 → 4.96 (card 5.31) | As above. Dark keeps `blue-400` (7.74). |
| `--error` | light | `red-500` `oklch(0.64 0.208 25)` | `red-700` `oklch(0.51 0.192 28)` | on page: 3.47 → 5.93 (card 6.35) | As above; `red-600` reaches only 4.45 on the page. Dark keeps `red-400` (6.93). |

The light feedback steps are the lightest step of each desktop hue ramp that
reaches 4.5:1 on the page, card and popover.

## Kept at desktop values, below 3:1, by decision

| Role | Light | Dark | Rationale |
|---|---|---|---|
| `--border`, `--input` | `#D8DEE6`, 1.26:1 on page | `#233041`, 1.44:1 on page | SC 1.4.11 requires 3:1 only for visual information needed to identify a component. `border` draws decorative separators; inputs are identified by their fill and visible label. These two roles are excluded from the gate. **The verifier checks input boundaries on device.** |

## Mobile-only token (no desktop counterpart)

| Role | Theme | Value | Contrast | Reason |
|---|---|---|---|---|
| `--inline-code-foreground` | light | `brand-700` `oklch(0.47 0.16 35.2)` | 6.17 on the 5% inline-code tint | Following primary (`brand-600`) gives 4.43, and `--link` 4.44. Dark follows primary (5.77). |

## Not a deviation

- The desktop runtime user-theme default (`#00b96b`, `useUserTheme`) is not
  ported: mobile has no action-colour setting.
- Spacing and iconography are unchanged (PD-11). The type scale stays mobile's
  (PD-8).
- Charts, tags, code-block and chat surfaces and the usage heat scale are
  mobile-owned product-domain tokens. They stay on the Vercel (Geist) palette
  and are not part of the v2.2 port.
