---
type: SessionRecord
id: karpathy-session-88b9634f669042d6
title: Karpathy session 88b9634f6690
tags:
- karpathy
- session-learning
sources:
- session:d6c4083a-2dde-4433-bd2c-22715bd9cb28
timestamp: 2026-09-26T08:56:07.823931+00:00
created_at: 2026-09-26T08:56:07.823931+00:00
updated_at: 2026-09-26T08:56:07.823931+00:00
revision: 0
---

## Delta

The design is written, reviewed, and merged into `main` in both repos. The 11 files in `docs/webrtc/` are byte-identical on both `main` branches.

- **Mobile:** Prometheus-AGS/cherry-studio-app#1, squash-merged as `95e80515` after lint, typecheck and test passed. It also adds a "Designs" row to `docs/README.md` pointing at the new docs.
- **Desktop:** Prometheus-AGS/the-boss#7, merged as `3536ac55` from your account (GQAdonis) seconds after I marked it ready. The commit is SSH-signed and signed off, as the-boss requires.
  - **PR description:** I rewrote it afterwards to its template, and the description check now passes.
  - **Failing CI job:** one CI job (`basic-checks`) fails on a translation-sync error in the-boss's locale files. It already failed on `main` for the two previous merges (#5 and #6), so it isn't caused by these docs, but it is still red.

**Recommended design**
- **Transport:** iroh (QUIC with hole punching and your own relay servers) instead of WebRTC, because it gives one Rust networking stack on every platform, identifies devices by key, and needs no signaling server. WebRTC stays a later option if browser access or audio/video becomes a requirement. The folder is still called `webrtc`, as you asked.
- **Control:** each app's Rust core checks every remote command before the app runs it: who sent it, whether the device is still enrolled, expiry, replay, permissions, and a biometric-backed approval for risky tools. The commands themselves are the method set the phone already uses to control desktop agents today.
- **Sync:** changes are tracked per field, and each app writes them to an outbox table inside the same database transaction as the original change. Chat messages are written only by the device where that session runs. `canonical-model.md` maps every synced field to the actual columns in both apps' databases.
- **Offline phones:** a designated always-on desktop holds encrypted mail for devices that are offline and triggers generic push notifications.

**How it was researched and reviewed**
- **Research:** four independent web-research threads plus a survey of the existing remote-access code in both repos.
- **Review:** a defect critic, the team's security reviewer, and a sync red team. Every finding and its fix is in `adversarial-review.md`.
  - **Security:** the security reviewer blocked two rounds (three critical findings in the first draft, then one critical and three high in the revision) and passed the final version.
  - **Biggest change:** the review cut the design back. The CRDT library Loro, multiple admin devices, and phones running agents all moved to later phases, and settings that decide what runs on a device became changes that device must approve locally.

**Decisions for you** (OD-0 to OD-6 in `roadmap-and-verification.md`). The ones that differ from what you asked for:
- **OD-0:** iroh instead of WebRTC; web browsers could only reach your devices through the relay servers.
- **OD-0b:** in v1, phones and desktops control desktops and headless servers, but nothing controls a phone, because iOS and Android suspend apps in the background. Phones become targets in a later phase.
- **OD-0c:** "mostly Rust" is read as protocol, keys, security checks and sync in Rust, with agent execution and database writes staying in each app's existing TypeScript code.

**Not done or not verified**
- I didn't run the-boss's own docs checks after you stopped that step; the mobile link checker passed.
- This checkout's local `main` is now behind `origin/main`. I didn't pull, because your uncommitted changes from earlier in the session are still here.
- The `docs/webrtc-sync-design` branch still exists on both remotes.
- Your preference to produce design documents only, without code or build-tooling changes, is saved to memory.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: d6c4083a-2dde-4433-bd2c-22715bd9cb28
- Captured: 2026-09-26T08:56:06.696385Z
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
