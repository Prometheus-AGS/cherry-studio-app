# rebrand-011-branding-guard: regression guard and merge discipline

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

    - Scope: tooling | CI | docs/contrib
    - Depends on: rebrand-002, rebrand-007, rebrand-008
    - Owner / agent: `boss-mobile-upstream` (ledger, playbook) + `boss-mobile-release` (CI) — Claude Code
    - Est. complexity: M · Complexity score: Medium · Model class: medium
    - Customer value: MEDIUM (prevents the desktop's 42-string regression)
    - Details: `pnpm brand:check` scanning JSON locales, `.xcstrings`, Android `res/values*/strings.xml`,
      `app.json` usage strings, config plugins and TypeScript/Swift/Kotlin sources (product-name and brand-URL
      literals outside `src/shared/branding/`) for "Cherry" outside an allowlist (`scripts/brand-allowlist.json`:
      exact identifiers or path globs only, each with a reason; PD-5 contracts, service names, provenance links;
      reviewed by `boss-mobile-security`) (service names, PD-5
      contracts, provenance links); wire into `pr-ci.yml`; write `docs/contrib/upstream-merges.md` (naming
      table, values that are not branding, resolution rules) and `docs/contrib/fork-surface.md` (the team's upstream role reads it from there, so PD-9 does not block it).
    - Acceptance: check fails on a seeded "Cherry Studio" value in a locale and in an `.xcstrings` entry, passes on
      `main`; CI job visible on a PR.
