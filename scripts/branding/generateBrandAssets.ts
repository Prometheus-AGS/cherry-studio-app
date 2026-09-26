/**
 * Regenerates The Boss brand rasters from the vector sources in
 * `assets/branding/source/`. Reproducible, idempotent: re-running overwrites
 * the same output files with the same content.
 *
 * Requires `rsvg-convert` (installed via `brew install librsvg`) on PATH.
 *
 * Usage: `pnpm exec tsx scripts/branding/generateBrandAssets.ts`
 *
 * Part of `openspec/changes/rebrand-003-visual-assets` tasks 1–2, owned by
 * `boss-mobile-rebrand`. See `assets/branding/source/PROVENANCE.md`.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SOURCE_DIR = path.join(REPO_ROOT, 'assets/branding/source')
const BRANDING_DIR = path.join(REPO_ROOT, 'assets/branding')
const ASSETS_DIR = path.join(REPO_ROOT, 'assets')

const ICON_LIGHT_SVG = path.join(SOURCE_DIR, 'icon-light.svg')
const LOCKUP_LIGHT_SVG = path.join(SOURCE_DIR, 'lockup-light.svg')
const LOCKUP_DARK_SVG = path.join(SOURCE_DIR, 'lockup-dark.svg')
const WORDMARK_LIGHT_SVG = path.join(SOURCE_DIR, 'wordmark-light.svg')
const WORDMARK_DARK_SVG = path.join(SOURCE_DIR, 'wordmark-dark.svg')

/** Brand dark background, matching the-boss desktop's shipped app icon (`build/icons/1024x1024.png`). */
const ADAPTIVE_ICON_BACKGROUND_COLOR = '#111827'

/**
 * The mark alone (hexagon + spokes + crown), transparent background, derived
 * from `icon-light.svg` by dropping its full-bleed `<rect>` background and
 * grid overlay. The hexagon's circumradius is 16 of 48 canvas units (66.7%
 * diameter), which already matches the Android adaptive-icon safe zone, so no
 * extra padding/scaling is applied.
 */
const MARK_ONLY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 48 48" role="img" aria-label="The Boss mark">
<polygon points="24,8 37.86,16 37.86,32 24,40 10.14,32 10.14,16" fill="#E04E28"/>
<line x1="24" y1="24" x2="24" y2="8" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
<line x1="24" y1="24" x2="37.86" y2="16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
<line x1="24" y1="24" x2="10.14" y2="16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
<line x1="24" y1="24" x2="37.86" y2="32" stroke="#0B0F14" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
<line x1="24" y1="24" x2="24" y2="40" stroke="#0B0F14" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
<line x1="24" y1="24" x2="10.14" y2="32" stroke="#0B0F14" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
<circle cx="24" cy="8" r="2.75" fill="#FFFFFF"/>
<circle cx="37.86" cy="16" r="2.75" fill="#FFFFFF"/>
<circle cx="10.14" cy="16" r="2.75" fill="#FFFFFF"/>
<circle cx="37.86" cy="32" r="2.25" fill="#0B0F14" stroke="#E04E28" stroke-width="1.5"/>
<circle cx="24" cy="40" r="2.25" fill="#0B0F14" stroke="#E04E28" stroke-width="1.5"/>
<circle cx="10.14" cy="32" r="2.25" fill="#0B0F14" stroke="#E04E28" stroke-width="1.5"/>
<circle cx="24" cy="24" r="3" fill="#FFFFFF" opacity="0.95"/>
</svg>
`

/**
 * Android notification-icon silhouette: hexagon shape alone, solid white,
 * transparent elsewhere. Android discards all icon color and draws only the
 * alpha channel, and notification icons render at ~24dp on screen regardless
 * of source resolution, so this follows the brand guide's own "hex shape
 * alone" simplification threshold for icons at or below favicon size.
 */
const NOTIFICATION_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48" role="img" aria-label="The Boss notification mark">
<polygon points="24,8 37.86,16 37.86,32 24,40 10.14,32 10.14,16" fill="#FFFFFF"/>
</svg>
`

function assertRsvgConvertAvailable(): void {
  try {
    execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' })
  } catch {
    throw new Error(
      'rsvg-convert not found on PATH. Install it with `brew install librsvg` before running this script.',
    )
  }
}

function rasterize(svgPath: string, outPath: string, size: number): void {
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), svgPath, '-o', outPath])
}

function rasterizeWithAspect(svgPath: string, outPath: string, width: number, height: number): void {
  execFileSync('rsvg-convert', ['-w', String(width), '-h', String(height), svgPath, '-o', outPath])
}

async function main(): Promise<void> {
  assertRsvgConvertAvailable()
  mkdirSync(BRANDING_DIR, { recursive: true })

  // --- assets/icon.png: full-bleed app icon, 1024x1024, no alpha (iOS) ---
  const iconTmp = path.join(BRANDING_DIR, '.icon-tmp.png')
  rasterize(ICON_LIGHT_SVG, iconTmp, 1024)
  await sharp(iconTmp)
    .flatten({ background: ADAPTIVE_ICON_BACKGROUND_COLOR })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'icon.png'))
  execFileSync('rm', [iconTmp])

  // --- assets/branding/splash-logo.{svg,png}: mark only, transparent ---
  const splashSvgPath = path.join(BRANDING_DIR, 'splash-logo.svg')
  writeFileSync(splashSvgPath, MARK_ONLY_SVG)
  rasterize(splashSvgPath, path.join(BRANDING_DIR, 'splash-logo.png'), 1024)

  // --- assets/adaptive-icon.png: Android adaptive foreground, transparent ---
  // Same mark-only vector as the splash logo; its hexagon circumradius (16 of
  // 48 units = 66.7% diameter) already fits the adaptive-icon safe zone.
  rasterize(splashSvgPath, path.join(ASSETS_DIR, 'adaptive-icon.png'), 1024)

  // --- assets/branding/notification-icon.png: white silhouette, transparent ---
  const notificationSvgPath = path.join(BRANDING_DIR, 'notification-icon.svg')
  writeFileSync(notificationSvgPath, NOTIFICATION_MARK_SVG)
  rasterize(notificationSvgPath, path.join(BRANDING_DIR, 'notification-icon.png'), 192)

  // --- assets/branding/logo-{light,dark}.png: in-app lockup, transparent ---
  rasterizeWithAspect(LOCKUP_LIGHT_SVG, path.join(BRANDING_DIR, 'logo-light.png'), 1120, 260)
  rasterizeWithAspect(LOCKUP_DARK_SVG, path.join(BRANDING_DIR, 'logo-dark.png'), 1120, 260)

  // --- assets/branding/{lockup,wordmark}-{light,dark}.svg: copies for code ---
  for (const svg of [LOCKUP_LIGHT_SVG, LOCKUP_DARK_SVG, WORDMARK_LIGHT_SVG, WORDMARK_DARK_SVG]) {
    execFileSync('cp', [svg, path.join(BRANDING_DIR, path.basename(svg))])
  }

  // eslint-disable-next-line no-console
  console.log('Brand assets generated. See openspec/changes/rebrand-003-visual-assets/tasks.md.')
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exitCode = 1
})
