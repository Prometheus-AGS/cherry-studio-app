# boss-mobile repository map

## This repository

- Upstream git: CherryHQ/cherry-studio-app (remote `upstream` not configured yet; boss-mobile-upstream adds it read-only).
- Semantic desktop ports: CherryHQ/cherry-studio via `desktop-sync-manifest.json` and `pnpm desktop:sync:audit`.
- Agent instructions: `AGENTS.md` (`CLAUDE.md` is a symlink). KBD: `.kbd-orchestrator/`. Specs: `openspec/`.
- Code graph: `compass-out/` (local, not committed); query with the compass MCP server or CLI.

## Planned paths (created by their owners)

| Path | Owner | Purpose |
| --- | --- | --- |
| `src/shared/branding/` | rebrand | Single identity module (mirrors the-boss `src/shared/utils/branding.ts`) |
| `native/` (`Cargo.toml`, `uar-mobile/`) | rust-ffi | One Cargo workspace, one link unit, one tokio runtime |
| `native/boss-link/` | p2p | iroh + Loro transport crate, member of the link unit |
| `modules/uar-runtime/` | rust-ffi | Nitro/Expo native module wrapping the link unit |
| `packages/uar-bridge/` | rust-ffi | TypeScript bridge API |
| `scripts/rust/` | rust-ffi | xcframework and jniLibs builds |
| `docs/contrib/` | upstream | Merge playbook and log |
| `docs/migration/` | rebrand | Migration phase plan |
| `docs/product/`, `.agent-team/boss-mobile/product/` | product | Parity matrix, decisions |
| `docs/design/`, `.impeccable.md` | ux | Design contracts, design context |

## Related repositories (read-only from here)

| Repository | Path | Relationship | Team |
| --- | --- | --- | --- |
| the-boss (desktop) | `/Users/gqadonis/Projects/prometheus/the-boss` | Brand and feature parity source; desktop P2P peer; RemoteRunner host | `.agent-team/boss-core` |
| universal-agent-runtime | `/Users/gqadonis/Projects/prometheus/universal-agent-runtime` | Embedded runtime (feature `embedded-mobile`); mobile blockers fixed there | `.agent-team` (uar-core) |
| prometheus-skills-mini | `/Users/gqadonis/Projects/prometheus/prometheus-skills-mini` | Skill pack; placement classes | — |

Changes needed in a related repository are written as handoffs to that repository's team, never edited from here.
