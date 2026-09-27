# rebrand-010-repo-rename: GitHub repository becomes `the-boss-mobile`

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

    - Scope: repository | config | docs
    - Depends on: rebrand-009
    - Owner / agent: `boss-mobile-upstream` drives (rename, remotes, `desktopSyncAudit`), then sequentially
      `boss-mobile-rebrand` (repository URL constant in `src/shared/branding`), `boss-mobile-lead` (README,
      `docs/guides/development.md`), `boss-mobile-app` (Notion `client_uri`, `modules/*` podspecs it owns),
      `boss-mobile-p2p` (`local-network-access`, `remote-discovery` podspecs), `boss-mobile-ux`
      (`packages/ui/CherryStudioUI.podspec`), `boss-mobile-release` (root package, issue templates, scripts) —
      Claude Code; **outward action: operator confirms at execution time**
    - Est. complexity: S · Complexity score: Medium · Model class: medium
    - Customer value: MEDIUM
    - Details: `gh repo rename the-boss-mobile`; update `origin`; add `upstream` =
      `CherryHQ/cherry-studio-app` with push disabled; update our-fork links (README, About, issue templates,
      `docs/guides/development.md`, Notion `client_uri`, podspec homepage/source); rename root package per PD-7
      together with `desktopSyncAudit` fixtures; guard or remove `publishGitcodeRelease.ts` (publishes to
      upstream's GitCode); keep upstream references used for merges.
    - Acceptance: `git remote -v` correct; old URL redirects; CI green on the renamed repo; `pnpm desktop:sync:audit`
      tests pass.

