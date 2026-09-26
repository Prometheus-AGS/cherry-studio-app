---
type: SessionRecord
id: karpathy-session-253f072457339fda
title: Karpathy session 253f07245733
tags:
- karpathy
- session-learning
sources:
- session:d6c4083a-2dde-4433-bd2c-22715bd9cb28
timestamp: 2026-09-26T07:30:45.861390+00:00
created_at: 2026-09-26T07:30:45.861390+00:00
updated_at: 2026-09-26T07:30:45.861390+00:00
revision: 0
---

## Delta

I've installed typeui and copied the MiniMax agents.

**typeui**
- **What's installed:** the typeui repo contains only one agent skill, `typeui-fundamentals`. It's six markdown files of UI/UX, typography, spacing and accessibility principles, MIT-licensed, with no scripts. The installer's security scans rated it safe or low risk.
- **Where:** user level, copied (not linked) into `~/.claude/skills`, `~/.agents/skills` (which Codex, OpenCode, Kimi Code and Zed share) and `~/.minimax/skills`. Nothing was added to the repo.
- **Style designs:** typeui's ~60 styles (Bento, Brutalism, Editorial and so on) aren't skills. You pull them as DESIGN.md files with `npx typeui.sh pull <slug> --format design`. The UX role's instructions now say that, and that a pulled design never replaces `DESIGN.md` without your say-so.
- **Team update:** I added `typeui-fundamentals` to the UX role and removed the "not installed yet" wording, then updated the team manifest. Only the UX agent file changed, and I replaced it for Claude Code, Codex, OpenCode, Kimi and MiniMax. The install check reports clean.

**MiniMax agents**
- **Copied:** all 13 `boss-mobile-*` agents are in `~/.minimax/agents/`. `MINIMAX_DATA_DIR` isn't set, so that's MiniMax's default folder. None of the existing agents there has a `boss-mobile` name, so nothing was overwritten.
- **Not confirmed:** I couldn't check that MiniMax picks them up. `mcode` has no command that lists agents. The built-in agents there also have a `config.yaml`, and ours only have `agent.md`, which is the documented layout. Check the agent list in the MiniMax interface. `mcode exec` also can't select a specific agent, so from the command line you'd adopt a role by asking for it in the prompt.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: d6c4083a-2dde-4433-bd2c-22715bd9cb28
- Captured: 2026-09-26T07:30:43.643490Z
- Project: /Users/gqadonis/Projects/prometheus/cherry-studio-app

## Changed Paths

- .gitignore
- AGENTS.md
- .agent-team/
- .agents/UI_UX_PROTOCOL.md
- .claude/agents/
- .claude/commands/
- .claude/hooks/
- .claude/rules/
- .claude/settings.json
- .codex/
- .compass/
- .kbd-orchestrator/
- .kimi-code/
- .opencode/
- compass-out/
- openspec/
- versions.toml
