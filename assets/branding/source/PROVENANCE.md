# Brand asset provenance

**Origin:** `/Users/gqadonis/Projects/know-me/cherry-studio/docs/branding/` (Brand Guide v2.2, dated
2026-06-14 per source file mtimes).

**Imported:** 2026-09-26, by `boss-mobile-rebrand`, for
`openspec/changes/rebrand-003-visual-assets` tasks 1–2.

**Ownership / license:** Know Me Tools brand assets. Proprietary to Know Me Tools; not third-party
or open-source licensed content. Used here under the same ownership that produced
`the-boss` desktop's identity module and brand guide.

## Files

| File in this directory | Copied from | Notes |
| --- | --- | --- |
| `icon-light.svg` | `icon-light-512.svg` | Canonical app-icon mark: `viewBox="0 0 48 48"`, navy `#111827` full-bleed background, orange `#E04E28` hexagon, white "active crown" (top 3 spokes), dark bottom 3 spokes with orange-ringed nodes. Verified to match the-boss desktop's shipped `build/icons/1024x1024.png` and `build/logo.png` pixel-for-pixel in composition. All `icon-light-{32,48,64,96,192,256,512}.svg` exports in the source directory are byte-identical after the `width`/`height` attributes (same `viewBox`, same geometry) — one representative file is sufficient as the vector source. |
| `icon-dark.svg` | `icon-dark-512.svg` | Alternate mark: orange `#FF6A3D` full-bleed background, dark `#0B0F14` hexagon, same node/spoke structure recolored for placement on dark surfaces. Kept for future iOS 18+ dark/tinted app-icon variants or dark-surface use; not used as the primary app icon (see `icon-light.svg`). Same byte-identical-across-sizes property as above. |
| `lockup-light.svg` | `lockup-light.svg` | Icon tile + "THE BOSS / AGENT STUDIO" wordmark lockup, dark text, for light surfaces. `viewBox="0 0 560 130"`, transparent canvas outside the icon tile. |
| `lockup-dark.svg` | `lockup-dark.svg` | Same lockup, light text, for dark surfaces. |
| `wordmark-light.svg` | `wordmark-light.svg` | Text-only "THE BOSS" wordmark, dark text, for light surfaces. `viewBox="0 0 310 75"`. |
| `wordmark-dark.svg` | `wordmark-dark.svg` | Text-only wordmark, light text, for dark surfaces. |

## Derived generation

`scripts/branding/generateBrandAssets.ts` reads `icon-light.svg` and `lockup-{light,dark}.svg` from
this directory to produce the consumable outputs under `assets/branding/` and the top-level
`assets/icon.png` / `assets/adaptive-icon.png`. See that script and
`openspec/changes/rebrand-003-visual-assets/tasks.md` for what each output is for.

The hexagon mark in `icon-light.svg` / `icon-dark.svg` has a circumradius of 16 units on the 48-unit
canvas (33.3% of the half-width), so its bounding circle is exactly 66.7% of the canvas — already
sized to the Android adaptive-icon safe zone with no extra padding needed.
