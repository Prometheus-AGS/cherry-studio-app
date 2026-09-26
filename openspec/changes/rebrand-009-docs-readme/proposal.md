# rebrand-009-docs-readme: README and documentation

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

   - Scope: docs
   - Depends on: rebrand-001, rebrand-003
   - Owner / agent: `boss-mobile-lead` drives (README, AGENTS heading, root `docs/` guides it owns), then
     sequentially `boss-mobile-runtime` (`docs/references/ai`, `agent`), `boss-mobile-app` (`docs/references/chat`,
     `lifecycle`, feature READMEs), `boss-mobile-ux` (UI references), `boss-mobile-release` (`.github/ISSUE_TEMPLATE`,
     build guides) — Claude Code
   - Est. complexity: M · Complexity score: Low · Model class: small
   - Customer value: MEDIUM
   - Details: Rebrand `README.md` like `the-boss:README.md` (logo, title, Know Me Tools / Prometheus-AGS links,
     credit to Cherry Studio and AGPL, note that `@cherrystudio/*` names and Cherry services are technical
     contracts); `AGENTS.md` heading; user-facing product mentions in `docs/` (keep upstream issue links used as
     provenance); feature READMEs; issue templates text.
   - Acceptance: `pnpm docs:check-links` passes; no product-name "Cherry Studio" in docs outside provenance and
     technical-contract references.

