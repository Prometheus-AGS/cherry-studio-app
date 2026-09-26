# rebrand-007-strings-app: product-name values in all app locales

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: i18n | backend strings
   - Depends on: rebrand-001
   - Owner / agent: `boss-mobile-app` (locales) then `boss-mobile-runtime` (`src/backend/ai/agent/tools/agentManagementTools.ts`) — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH
   - Details: Change **values, never keys** in all 13 locales under `src/frontend/i18n/locales/` (30 lines each)
     and the 2 painting-template locales, using the PD-6 naming table and locale word order; default agent name
     ("Boss Agent"); agent tool descriptions in `agentManagementTools.ts`; `cherry-ai.com` links in locale values
     through branding constants where interpolation allows. Keep CherryIN/CherryAI.
   - Acceptance: `pnpm i18n:check` passes; zero "Cherry" in locale values outside the allowlist; spot-check
     zh-cn, ja-jp, de-de rendering on device.

