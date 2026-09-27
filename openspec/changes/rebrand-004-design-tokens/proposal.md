# rebrand-004-design-tokens: Brand Guide v2.2 color and radius tokens

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: packages/design-tokens | ui
   - Depends on: NONE
   - Owner / agent: `boss-mobile-ux` — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH
   - Details: Rewrite `packages/design-tokens/src/styles/{tokens/colors/*, shadcn.css, product.css}` to v2.2 using
     the desktop oklch values (`the-boss:packages/ui/src/styles/tokens/colors/{primitive,providers}.css`):
     ember primary per theme (brand-500 light / brand-400 dark), brand ramp, cool neutrals and surface ladder
     (background → card → popover → sidebar), status 500/400 steps, link, ring, `--control-active` to ember,
     `--radius` 10px. Rebuild `native.css`; update `check.ts` expectations only where the contract changed.
     Do not copy the desktop's runtime `#00b96b` user-theme default.
   - Acceptance: `pnpm design:check` passes, extended with WCAG 2.2 AA contrast assertions (≥ 4.5:1 text,
     ≥ 3:1 UI) computed in `packages/design-tokens/scripts/check.ts` for foreground/primary/link on
     background, card, popover and sidebar in both themes; device screenshots light/dark of home, conversation,
     settings, agent list, model picker sheet and onboarding reviewed by `boss-mobile-verifier` for v2.2
     palette use (not pixel parity with desktop layouts).

