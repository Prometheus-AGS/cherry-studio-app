# rebrand-005-typography: brand fonts and type roles

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: assets | tokens | ui
   - Depends on: rebrand-004
   - Owner / agent: `boss-mobile-ux` + `boss-mobile-release` (native rebuild) — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: MEDIUM
   - Details: Vendor static TTFs with licenses: Space Grotesk (display 400/600/700), Inter (UI 400/500/600/700),
     JetBrains Mono (mono 400/500/600, replaces Geist Mono), Roboto (body 400/500 — include for desktop parity,
     or drop if body = Inter is approved at review); register in `expo-font`; add Uniwind font-role variables
     (display, ui, body, mono, eyebrow); apply to heading and text primitives in CherryUI; keep the mobile
     size scale (PD-8).
   - Acceptance: fonts load in development builds on both platforms; Dynamic Type / font-scale steps still work;
     `pnpm ui:check-boundaries` passes; bundle size delta recorded.

