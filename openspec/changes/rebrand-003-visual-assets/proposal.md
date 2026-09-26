# rebrand-003-visual-assets: icons, splash and in-app logos from brand sources

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: assets | ui
   - Depends on: rebrand-001, rebrand-004 (`--brand` lives in the token files)
   - Owner / agent: `boss-mobile-rebrand` drives (sources, generation, `assets/`), then `boss-mobile-ux` (tokens,
     `exportBrand.ts`), then `boss-mobile-app` (About screen, onboarding LogoDraw, background-activity
     environment) — sequential, Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH
   - Details: Copy the v2.2 SVG sources (`know-me/cherry-studio/docs/branding/`: icon light/dark, lockup,
     wordmark) into `assets/branding/source/` with provenance. Generate `icon.png` (1024, full-bleed), Android
     adaptive foreground (transparent, safe-zone padded hexagon) + background color, splash image, notification
     icon, in-app logo; replace `cherry-studio-*` asset usages (About, background-activity environment, export
     watermark base64, onboarding LogoDraw paths/palette), `--brand` token value. Keep the CherryIN provider icon.
   - Acceptance: visual check on iOS and Android (light and dark) of home-screen icon, splash, notification,
     About, onboarding animation; no raster upscaling (sources are vector).

