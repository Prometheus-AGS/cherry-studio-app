# rebrand-001-branding-module: single identity module and glossary

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: shared | ui | backend
   - Depends on: NONE
   - Owner / agent: `boss-mobile-rebrand` (module, then drives) with sequential consumer edits by `boss-mobile-app`
     (backend/frontend features) and `boss-mobile-ux` (`src/frontend/appShell/fileExport/exportBrand.ts`) — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH (every later change reads from it)
   - Details: Create `src/shared/branding/` mirroring `the-boss:src/shared/utils/branding.ts`: `PRODUCT_NAME`,
     `SHORT_NAME`, `COMPANY_NAME`, `APP_ID`, `APP_SLUG`, website / docs / support / issues / repository URLs,
     attribution name and headers, export watermark brand. Route consumers through it: About screen, export
     watermark (`exportBrand.ts`), `defaultAppHeaders.ts`, `AnalyticsService` app name, device-name fallback
     (`DesktopConnectionRuntime.ts:348`), GitHub token URL name, Feishu/DingTalk client names. Update
     `scripts/i18nGlossary.json` (`doNotTranslate`: "The Boss"; keep CherryIN, CherryAI). No identifier or
     storage renames (PD-5).
   - Acceptance: the consumer files named above contain no product-name or brand-URL literal (they import the
     module); unit test for module exports; `pnpm typecheck`, `pnpm lint` pass. The repository-wide check is
     the phase exit gate (`pnpm brand:check`, rebrand-011).

