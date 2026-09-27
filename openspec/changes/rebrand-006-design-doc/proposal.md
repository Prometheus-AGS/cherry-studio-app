# rebrand-006-design-doc: DESIGN.md for The Boss mobile

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: docs
   - Depends on: rebrand-004, rebrand-005
   - Owner / agent: `boss-mobile-ux` — Claude Code
   - Est. complexity: S · Complexity score: Low · Model class: small
   - Customer value: MEDIUM
   - Details: Replace the Vercel/Geist direction in `DESIGN.md` with the v2.2 system (palette, surfaces, feedback
     roles, fonts and roles, radius, iconography, motion contract unchanged); align `docs/guides/ui-development.md`;
     create `.impeccable.md`. Record that DESIGN.md now documents v2.2 values that the desktop DESIGN.md lacks,
     for the desktop team to adopt.
   - Acceptance: every token named in DESIGN.md exists in `packages/design-tokens`; `pnpm docs:check-links` passes.

