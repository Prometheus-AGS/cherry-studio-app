---
type: SessionRecord
id: karpathy-session-ff9ef606e097ceea
title: Karpathy session ff9ef606e097
tags:
- karpathy
- session-learning
sources:
- session:d6c4083a-2dde-4433-bd2c-22715bd9cb28
timestamp: 2026-09-26T06:58:28.599583+00:00
created_at: 2026-09-26T06:58:28.599583+00:00
updated_at: 2026-09-26T06:58:28.599583+00:00
revision: 0
---

## Delta

I ran the bootstrap with the mixed profile. `verify.sh` reports 10 PASS, 1 FAIL, 2 WARN. Nothing is committed.

**What it wrote**
- **`AGENTS.md`:** the Prometheus rules were added inside marker comments, from line 41 on. The original project text above them is unchanged. A small UI/UX routing section was added below them. `CLAUDE.md` was already a link to `AGENTS.md`, so both show the new rules.
- **`.claude/`:**
  - four hooks (`tier-guard`, `single-writer`, `sycophancy-gate`, `reanchor`), wired into a new `settings.json`
  - `rules/typescript.md`
  - `agents/artifact-critic.md`
- **`.prometheus/`:** the session-log, decisions, gotchas and fleet files, plus `postmortems/`.
- **Also created:** `.kbd-orchestrator/current-waypoint.json` (phase `spec`, status `ready`) and a `versions.toml` stub. `.gitignore` gained three lines for the hooks' lock and backup files.
- **`.agents/UI_UX_PROTOCOL.md`:** added by the UI/UX helper installer.

**Something I undid.** The bootstrap ran a UI/UX helper installer that wasn't in the dry-run plan. It edited three tracked upstream skill files (`.agents/skills/vercel-composition-patterns` and `vercel-react-native-skills`) and added provenance files next to them. `AGENTS.md` says to keep upstream skill files unchanged. `pnpm skills:check` passed anyway, because it only checks which skills are listed. I reverted those three files and deleted the four added files. The helper's other copies are in gitignored skill folders and stay local. Running `pnpm skills:check` also ran a `pnpm install`.

**The FAIL:** the managed rules come to 1,762 words, over the skill's own 1,500-word limit for the mixed profile. The extra length comes from the skill's template, not from this repo. Editing inside the markers won't stick, because a re-run overwrites them. The other options are the lean profile, which needs a measured entry in `.prometheus/model-fleet.md` first, or living with the FAIL.

**The WARNs** are about your machine, not this repo. Across all user and plugin scopes there are 3,082 skills, about 56 times the skill-description budget. Claude Code will silently drop many skill descriptions, so those skills won't trigger on their own. Raising `skillListingBudgetFraction` can't fix a gap that size; you'd need to disable some plugins or skill packs.

**Before you commit anything:**
- **`.claude/settings.json` would apply to everyone who clones the repo.** It sets `defaultMode: acceptEdits`, blocks `rm -rf`, blocks edits to `versions.toml`, and wires hooks that expect `.prometheus/` and the waypoint. If it's only for you, move it to `.claude/settings.local.json`.
- **Two of the new rules conflict with this repo:**
  - "Only test at the phase boundary" contradicts the focused-suite loop in `docs/guides/testing-and-ci.md`.
  - "Capability inversion" (agent kernels never write) doesn't describe this app.

  You picked "apply all", so I didn't add a note saying the project guides win. Tell me if you want one, placed outside the markers so re-runs keep it.
- **Two phase sources:** the new waypoint says phase `spec`, while `project.json` from `/kbd-init` still has `activePhase: null`. They'll agree once you run `/kbd-new-phase`.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: d6c4083a-2dde-4433-bd2c-22715bd9cb28
- Captured: 2026-09-26T06:51:01.852172Z
- Project: /Users/gqadonis/Projects/prometheus/cherry-studio-app

## Changed Paths

- .gitignore
- AGENTS.md
- .agents/UI_UX_PROTOCOL.md
- .claude/agents/
- .claude/commands/
- .claude/hooks/
- .claude/rules/
- .claude/settings.json
- .compass/
- .kbd-orchestrator/
- .kimi-code/
- .opencode/
- compass-out/
- openspec/
- versions.toml
