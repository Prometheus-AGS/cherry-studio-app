# Execution: rebrand-the-boss-mobile-ui

- Backend: **openspec** (changes `openspec/changes/rebrand-0NN-*`), driven one task at a time by `kbd-apply`
  (`begin-task` / `end-task`), which fires KBD hooks and syncs canonical state.
- Harness: Claude Code with the `boss-mobile` agent team. The lead (this session) dispatches each change to its
  driving role's native subagent (`.claude/agents/boss-mobile-*.md`), co-owners in sequence inside the change,
  at most two builders at once on disjoint paths (plan "Execution Round Order").
- Branch: `feat/rebrand-the-boss-mobile-ui` off `origin/main`; one PR for the phase, one or more Conventional
  Commits per change (`docs/guides/git-workflow.md`). A preceding commit on the same branch adds the operator-
  approved agent tooling (PD-9).
- Verification policy: no per-task or per-change test runs. Builders keep code compiling. After every
  production change is complete: one production-path gate (local `pnpm lint`, `pnpm format:check`,
  `pnpm typecheck`, `pnpm i18n:check`, `pnpm design:check`, `pnpm ui:check-boundaries`, `pnpm brand:check`,
  focused suites; clean `expo prebuild`; device walkthrough), then one cumulative review by
  `boss-mobile-security` and `boss-mobile-verifier` (independent contexts), then `kbd-apply verify` /
  `archive` per change.
- Operator decisions in force: see plan.md "Operator Decisions (2026-09-26, at /kbd-execute)".
- Outward actions needing confirmation at execution time: repository rename (rebrand-010), pushing and opening
  the PR.
