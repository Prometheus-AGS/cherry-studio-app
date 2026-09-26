# boss-mobile routing

[team.json](team.json) is canonical; this file is rendered from it. `boss-mobile-lead` routes every request.
When the harness cannot delegate, the active agent adopts `boss-mobile-lead` and then each assigned role's
instructions in sequence, and says so.

## Default active group

Lead + one owning builder. A second builder joins only when the change crosses a contract (Rust API, wire
protocol, design tokens, persistence schema). Never more than two builders at once. `boss-mobile-security`
and `boss-mobile-verifier` are sequential gates after the builders and do not count toward that cap.
Upstream merge windows are exempt: `boss-mobile-upstream` drives and consults owners one at a time.

## Precedence (first match drives; later matches support)

1. Upstream sources (CherryHQ/cherry-studio-app git; CherryHQ/cherry-studio desktop via desktop-sync-manifest) -> upstream
2. Security incident -> security investigates, path owner fixes
3. Scope, priority, acceptance, the-boss parity, "port desktop feature X" -> product first
4. Identity and brand -> rebrand (+release for signing/EAS, +ux for in-app icons)
5. Rust / FFI / native link unit / UAR mobile build -> rust-ffi
6. Off-LAN connectivity, pairing, roster, CRDT sync transport -> p2p
7. Agent stack and skill placement -> runtime
8. Schema, migrations, persistence -> data
9. Design system, components, visual direction -> ux
10. Screens and feature logic -> app (against a ux design contract)
11. Build, CI, root manifests and config -> release
12. Ambiguous -> the lead asks one question or investigates read-only

Dependency order inside a change: product acceptance -> design contract -> Rust/native API -> TS bridge -> data ->
feature/UI -> security gate -> verification gate.

## Roles

| Role | Triggers | Tier | Depends on | Skills |
| --- | --- | --- | --- | --- |
| `boss-mobile-lead` | Routing, sequencing, agent instructions, KBD/OpenSpec state, unowned paths | hard | — | `agent-team-manage`, `agent-team-handoff`, `agent-team-models`, `kbd-process-orchestrator`, `openspec-propose`, `compass`, `adversarial-review` |
| `boss-mobile-product` | Priorities, acceptance criteria, the-boss parity, "port desktop feature X", peer scope | medium | `boss-mobile-lead` | `openspec-propose`, `agent-team-handoff`, `compass` |
| `boss-mobile-rebrand` | Name, IDs, scheme, icons, brand copy, migration phase sequencing | medium | `boss-mobile-lead`, `boss-mobile-product` | `openspec-propose`, `agent-team-handoff`, `expo-deployment`, `compass` |
| `boss-mobile-upstream` | CherryHQ/cherry-studio-app merges, CherryHQ/cherry-studio desktop ports (desktop-sync-manifest), conflicts | hard | `boss-mobile-lead` | `resolving-merge-conflicts`, `git-workflow-and-versioning`, `sync-cherry-desktop`, `compass`, `agent-team-handoff` |
| `boss-mobile-rust-ffi` | Rust crates, the native link unit, FFI, Nitro/uniffi, xcframework/jniLibs, UAR mobile build | hard | `boss-mobile-lead` | `prometheus-rust-workspace`, `rust-best-practices`, `rust-async-patterns`, `rust-testing`, `hybrid-mobile-architecture`, `flutter-rust-ffi`, `expo-dev-client`, `agent-team-handoff` |
| `boss-mobile-p2p` | Off-LAN access, pairing, device roster, relays, iroh/WebRTC, CRDT sync transport, wire protocol | hard | `boss-mobile-lead`, `boss-mobile-product`, `boss-mobile-rust-ffi` | `pem-local-first`, `sync-doctrine`, `peer-profile-sync`, `prometheus-rust-workspace`, `rust-async-patterns`, `agent-runtime-security`, `agent-team-handoff` |
| `boss-mobile-runtime` | Agent loop, providers, tools, skill placement, UAR host adapters (TS) | hard | `boss-mobile-lead`, `boss-mobile-rust-ffi`, `boss-mobile-p2p` | `hybrid-mobile-architecture`, `agui-event-contract`, `content-block-ui`, `liter-llm-bridge`, `local-inference-lanes`, `agent-team-handoff` |
| `boss-mobile-data` | SQLite schema, migrations, contracts, UAR persistence adapter, CRDT storage | medium | `boss-mobile-lead`, `boss-mobile-rust-ffi` | `react-native-best-practices`, `pem-local-first`, `agent-team-handoff` |
| `boss-mobile-ux` | Design system, tokens, CherryUI, app shell, motion, visual direction, screen design contracts | hard | `boss-mobile-lead`, `boss-mobile-product`, `boss-mobile-rebrand` | `prometheus-ui-ux`, `impeccable`, `design-taste-frontend`, `taste-skill`, `ui-ux-pro-max`, `typeui-fundamentals`, `imagegen-frontend-mobile`, `expo-native-ui`, `expo-ui`, `building-native-ui`, `uniwind`, `vercel-react-native-skills`, `expo-animation`, `a11y-gate` |
| `boss-mobile-app` | Screens, features, hooks, routes, services, device modules, locale files | medium | `boss-mobile-lead`, `boss-mobile-ux`, `boss-mobile-data` | `react-native-best-practices`, `vercel-react-native-skills`, `vercel-composition-patterns`, `expo-router`, `native-data-fetching`, `diagnose` |
| `boss-mobile-release` | EAS, CI, app.config.ts, package.json/lockfile/workspace, lint/test/ts config | medium | `boss-mobile-lead`, `boss-mobile-rust-ffi`, `boss-mobile-rebrand` | `expo-deployment`, `expo-cicd-workflows`, `eas-update-insights`, `upgrading-expo`, `expo-dev-client`, `agent-team-handoff` |
| `boss-mobile-security` | Gate: FFI/unsafe, pairing, keys, listeners, relays, remote execution, tool approval | hard | `boss-mobile-lead` | `agent-runtime-security`, `security-review`, `prometheus-rust-auditor`, `adversarial-review` |
| `boss-mobile-verifier` | Gate: device acceptance, independent design review, release readiness | medium | `boss-mobile-lead` | `agent-device`, `diagnose`, `adversarial-review`, `prometheus-ui-review` |

## Gates

- **Security** reviews any change to FFI/unsafe code, pairing, device roster, keys, network listeners, relays,
  remote execution or tool approval. Findings: `.agent-team/boss-mobile/reviews/security/`.
- **Verifier** verifies any user-visible or cross-domain change on iOS and Android devices and runs the
  independent design review for ux work. Reports: `.agent-team/boss-mobile/reviews/verification/`.
- A review in the builder's own context or on the same model is labelled "same-context, not independent".

## Shared, serialized paths

Any role may edit these for its own change after the lead serializes it; the listed owner keeps them coherent.

- `src/frontend/i18n/locales/**` (owner: app) — authors translate their own copy into every locale; `pnpm i18n:check`.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (owner: release) — requested through release; `pnpm dedupe`.
- `app.config.ts` (owner: release) — native module and plugin registration requests.
- `AGENTS.md` outside managed regions (owner: lead).

## Merge exception

On a `merge/upstream-*` branch, `boss-mobile-upstream` may write any path needed for the merge. Conflicts in a path
listed in `upstream/fork-surface.md` go to that path's owner, one at a time.

## Skill placement for the shipped app

| Class | Where it runs | Examples |
| --- | --- | --- |
| On-device | Embedded UAR (SKILL.md-only or native Rust) | refine-content, refine-a2ui, refine-mcp-ui, refine-validate, adversarial-review, liter-llm FFI |
| Remote | Paired the-boss desktop via UAR RemoteRunner or MCP over HTTP on the P2P link | artifact-refiner, refine-ui/logo/image, convert-*, ideation-mindmap, kbd-memory-recall, surreal-memory, pk |
| Dev-time | Coding agents only | kbd-*, openspec-*, rust guidance, scaffolds |

`boss-mobile-runtime` maintains the authoritative table in `.agent-team/boss-mobile/runtime/skill-placement.md`.

## Harness notes

| Harness | Definitions | Limits |
| --- | --- | --- |
| Claude Code | `.claude/agents/boss-mobile-*.md` (opus/sonnet per role) | Subagents, not an experimental agent team |
| Codex | `.codex/agents/boss-mobile-*.toml` | Model from Codex config |
| OpenCode | `.opencode/agents/boss-mobile-*.md` | Model from OpenCode config |
| Kimi Code | `.kimi-code/agents/boss-mobile-*.md` | Ignores per-role models: every review there is same-model |
| MiniMax Code | `exports/minimax/agents/*/agent.md` -> copy to `$MINIMAX_DATA_DIR/agents/` (default `~/.minimax/agents/`) | `mcode exec` has no agent selector; adopt roles by instruction |

Skills bound to roles resolve from each harness's own skill directories. Many live only in `~/.claude/skills`;
other harnesses need them installed at user level (repository rule: personal agent tooling stays out of the repo).

## Ownership

Every tracked file maps to exactly one role (checked at team creation: 0 overlaps, 0 gaps apart from
dotfiles inside owned directories, which belong to that directory's owner).

### boss-mobile-lead

- `.agent-team/boss-mobile/tasks/**`
- `.agent-team/boss-mobile/handoffs/**`
- `.agent-team/boss-mobile/*.md`
- `.agent-team/boss-mobile/*.json`
- `AGENTS.md`
- `CLAUDE.md`
- `.agents/**`
- `.claude/**`
- `.codex/**`
- `.opencode/**`
- `.kimi-code/**`
- `skills-lock.json`
- `scripts/skills-*.ts`
- `.kbd-orchestrator/**`
- `openspec/config.yaml`
- `openspec/specs/**`
- `openspec/changes/archive/**`
- `openspec/changes/*/tasks.md`
- `openspec/changes/*/design.md`
- `openspec/changes/*/.openspec.yaml`
- `.prometheus/**`
- `docs/README.md`
- `docs/guides/development.md`
- `docs/guides/extending.md`
- `docs/guides/git-workflow.md`
- `docs/guides/testing-and-ci.md`
- `docs/guides/parallel-device-testing.md`
- `docs/guides/github-plugin-authorization.md`
- `docs/references/architecture-overview.md`
- `docs/references/code-organization.md`
- `docs/references/naming-conventions.md`
- `docs/references/domain-language.md`
- `README.md`
- `.compass/**`

### boss-mobile-product

- `.agent-team/boss-mobile/product/**`
- `docs/product/**`
- `openspec/changes/*/proposal.md`
- `openspec/changes/*/specs/**`

### boss-mobile-rebrand

- `src/shared/branding/**`
- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/cherry-studio-*`
- `assets/branding/**`
- `docs/migration/**`
- `.agent-team/boss-mobile/migration/**`

### boss-mobile-upstream

- `docs/contrib/**`
- `.agent-team/boss-mobile/upstream/**`
- `.gitattributes`
- `desktop-sync-manifest.json`
- `scripts/desktopSyncAudit.ts`
- `patches/**`

### boss-mobile-rust-ffi

- `native/Cargo.toml`
- `native/Cargo.lock`
- `native/uar-mobile/**`
- `native/.cargo/**`
- `modules/uar-runtime/**`
- `packages/uar-bridge/**`
- `scripts/rust/**`
- `.agent-team/boss-mobile/rust-ffi/**`

### boss-mobile-p2p

- `native/boss-link/**`
- `packages/remote-protocol/**`
- `packages/remote-transport/**`
- `modules/remote-discovery/**`
- `modules/local-network-access/**`
- `docs/references/remote-access/**`
- `.agent-team/boss-mobile/p2p/**`

### boss-mobile-runtime

- `packages/ai-core/**`
- `packages/ai-runtime/**`
- `packages/ai-sdk-provider/**`
- `packages/provider-registry/**`
- `packages/universal/**`
- `src/backend/ai/**`
- `docs/references/ai/**`
- `docs/references/agent/**`
- `docs/references/job-runtime.md`
- `docs/references/runtime-ownership.md`
- `docs/references/universal-package.md`
- `docs/references/web-search.md`
- `.agent-team/boss-mobile/runtime/**`

### boss-mobile-data

- `migrations/**`
- `drizzle.config.ts`
- `src/backend/data/**`
- `src/shared/data/**`
- `src/shared/contracts/**`
- `docs/references/data/**`

### boss-mobile-ux

- `DESIGN.md`
- `.impeccable.md`
- `packages/design-tokens/**`
- `packages/ui/**`
- `packages/app-icons/**`
- `src/frontend/components/**`
- `src/frontend/appShell/**`
- `src/frontend/styles/**`
- `.rnstorybook/**`
- `docs/design/**`
- `docs/guides/ui-development.md`
- `docs/references/ui-components.md`
- `docs/references/interaction-and-gesture-arbitration.md`
- `docs/references/navigation-and-insets.md`
- `docs/references/expo-ui-bottom-sheet-navigation.md`
- `docs/references/splash-screen-and-startup-animation.md`
- `docs/references/background-activity-presentation.md`
- `assets/fonts/**`

### boss-mobile-app

- `src/frontend/features/**`
- `src/frontend/hooks/**`
- `src/frontend/data/**`
- `src/frontend/i18n/**`
- `src/frontend/utils/**`
- `src/frontend/types/**`
- `src/app/**`
- `src/bootstrap/**`
- `src/types/**`
- `src/backend/core/**`
- `src/backend/services/**`
- `src/backend/utils/**`
- `src/backend/types/**`
- `src/backend/README.md`
- `src/shared/backgroundActivity/**`
- `src/shared/core/**`
- `src/shared/notifications/**`
- `src/shared/utils/**`
- `modules/backup-storage/**`
- `modules/crash-reporting/**`
- `modules/device-location/**`
- `modules/health-access/**`
- `modules/image-drop-target/**`
- `modules/pdf-text-extractor/**`
- `modules/system-integration/**`
- `assets/audio/**`
- `assets/paintings/**`
- `assets/permissions/**`
- `assets/plugins/**`
- `assets/default-user-avatar.svg`
- `scripts/i18n.ts`
- `scripts/i18nCatalog.ts`
- `scripts/i18nGlossary.json`
- `docs/guides/internationalization.md`
- `docs/references/chat/**`
- `docs/references/lifecycle/**`
- `docs/references/android-background-generation.md`
- `docs/references/document-export.md`
- `docs/references/file-preview-and-viewer.md`
- `docs/references/html-conversion.md`
- `docs/references/system-integration-design.md`

### boss-mobile-release

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `app.json`
- `app.config.ts`
- `index.ts`
- `eas.json`
- `.easignore`
- `.github/**`
- `tsconfig.json`
- `jest.config.js`
- `jest.setup.ts`
- `eslint.config.js`
- `.oxlintrc.json`
- `.oxfmtrc.json`
- `.pre-commit-config.yaml`
- `doctor.config.json`
- `.env.example`
- `.vscode/**`
- `scripts/buildLocal.ts`
- `scripts/with*.js`
- `scripts/publishGitcodeRelease.ts`
- `scripts/check-doc-links.ts`
- `scripts/__tests__/**`
- `metro.config.js`
- `babel.config.js`
- `react-native.config.js`
- `.gitignore`
- `LICENSE`
- `docs/guides/local-builds.md`
- `docs/guides/cloud-releases.md`

### boss-mobile-security

- `.agent-team/boss-mobile/reviews/security/**`

### boss-mobile-verifier

- `.agent-team/boss-mobile/reviews/verification/**`
- `.maestro/**`
