# Fork Surface

This ledger lists every path or pattern The Boss Mobile owns or has changed relative to
`CherryHQ/cherry-studio-app`, with the boss-mobile role that resolves merge conflicts in it. The
[upstream playbook](./upstream-merges.md) applies these owners during a merge: a conflict in a listed
path goes to its owner, one owner at a time; anything not listed is presumed upstream-owned and takes
upstream's version unless a test proves otherwise. Role definitions and full path ownership live in
[`.agent-team/boss-mobile/routing.md`](../../.agent-team/boss-mobile/routing.md).

Maintained by `boss-mobile-upstream`. Update it in the same change that adds fork-specific work to an
upstream-owned path. Once the `upstream` remote exists, this command lists the files the fork changed
and must all be covered below:

```bash
git diff --name-only "$(git merge-base HEAD upstream/main)" HEAD
```

## Identity And Brand

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `src/shared/branding/**` | rebrand | Single identity module; upstream has no such file. Every product name, id and brand URL resolves here. |
| `assets/branding/**` | rebrand | Logos, lockups, splash, notification icon and their sources. |
| `assets/branding/native-locales/**` | rebrand | Localized iOS InfoPlist permission strings and display names, one JSON per locale. |
| `assets/icon.png`, `assets/adaptive-icon.png`, `assets/cherry-studio-*` | rebrand | App icon and artwork; file names kept, contents replaced. |
| `scripts/branding/**` | rebrand | Brand asset generator. Not yet listed in `routing.md`; the lead confirms. |
| `app.json`, `app.config.ts` identity values | release | Name, slug, bundle and package ids, scheme, app groups, share-extension ids; values come from the branding module (rebrand decides them). |
| `app.config.ts` `REPORTING_DISABLED` | release | One switch that keeps Sentry, observe and insights off until The Boss has its own accounts (PD-4). |
| `eas.json`, `.env.example` | release | Upstream EAS project and App Store Connect ids removed. |
| `scripts/withSystemIntegration.js` | release | Share-extension display name and localized InfoPlist wiring. |
| `src/backend/utils/defaultAppHeaders.ts` | app | Outbound app-name headers from the branding module. |
| Root `package.json` `name` (`the-boss-mobile`) | release | Renamed with the repository (PD-7); `scripts/desktopSyncAudit.ts` asserts it. |
| `README.md`, `docs/guides/development.md`, `.github/ISSUE_TEMPLATE/*.yml` links | lead (README, guide); release (templates) | Point at `Prometheus-AGS/the-boss-mobile`; upstream provenance links to `CherryHQ` stay. |
| `modules/*/ios/*.podspec` `homepage` and summary/description | app; p2p for `local-network-access`, `remote-discovery` | Fork homepage and The Boss wording; pod names and `author` stay upstream's. |
| `packages/ui/CherryStudioUI.podspec` `source`, `packages/ui/package.json` `description`, `homepage` | ux | Fork URL and wording only; pod and package names are a technical contract. |
| `src/backend/services/analytics/AnalyticsService.ts` | app | Analytics reporting switch (off). |

## Copy And Translations

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `src/frontend/i18n/locales/*.json` values | app (shared, serialized) | Product-name values only; keys stay upstream's. |
| `assets/paintings/templates/locales/*.json` values | app | Same values-not-keys rule. |
| `scripts/i18nGlossary.json` | app | `The Boss` in the do-not-translate list. |
| `modules/system-integration/android/src/main/res/values*/strings.xml` values | app | Share-extension strings; `cherry_share_*` resource names are kept. |
| `modules/system-integration/ios/Resources/SystemIntegration.xcstrings`, `modules/system-integration/ios/Core/CherryStrings.swift` | app | Share-extension strings; `CherryStrings` type name kept (PD-5). |
| `src/frontend/features/settings/about/AboutScreen.tsx` | app | About screen reads the branding module. |
| `src/frontend/features/onboarding/components/LogoDraw/**` | app | Onboarding logo animation redrawn for The Boss mark. |
| `src/backend/ai/agent/host/agentSystemPrompt.ts`, `src/backend/ai/agent/tools/agentManagementTools.ts` | runtime | Model-facing product name. |

## Plugins And External Accounts

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `src/shared/data/types/plugin.ts` (`PluginDisabledReason`) | data | Catalog `disabledReason` contract. |
| `src/backend/services/builtInMcp/pluginRegistry.ts`, `createPluginsModule.ts` | app | Blocks new GitHub and Notion sign-ins while `disabledReason` is set (PD-4b). |
| `src/backend/services/builtInMcp/plugins/{github,notion}/**` | app | OAuth callbacks on the `theboss` scheme; Notion `client_uri` from the branding module. |
| `src/backend/services/builtInMcp/plugins/{dingtalk,feishu}/create*Client.ts` | app | Client identity from the branding module. |
| `src/frontend/features/plugin/**` (list, detail, connect screens) | app | Shows the localized disabled reason. |
| `docs/backend-services/**` | rebrand | Inventory of Cherry-operated services the future backend replaces. Not yet listed in `routing.md`; the lead confirms. |

## Design System

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `packages/design-tokens/src/styles/tokens/colors/boss.css` | ux | The Boss Brand Guide v2.2 colours. |
| `packages/design-tokens/DEVIATIONS.md` | ux | Every contrast-driven deviation from the desktop tokens. |
| `packages/design-tokens/src/styles/{native,product,shadcn}.css`, `tokens/{index,radius,typography}.css` | ux | Token adoption; regenerate with `pnpm design:build`, never hand-merge generated CSS. |
| `packages/design-tokens/scripts/{build-native-css,check,check-app-theme,contrast,css-contract}.ts` | ux | Contrast and contract checks for the fork's tokens. |
| `packages/ui/src/components/{bottom-sheet,button,chip,content-state,dialog,markdown-text,section,slider}/**` | ux | CherryUI components edited for the tokens; component names stay upstream's. |
| `packages/ui/src/background-activity/logo.ts`, `packages/ui/stories/foundations/**` | ux | Activity logo and token/typography foundations. |
| `assets/fonts/**` | ux | Brand typefaces and their licences. |
| `DESIGN.md`, `src/frontend/styles/global.css`, `src/frontend/appShell/fileExport/**` | ux | Design spec, global styles, export watermark brand. |
| `docs/guides/ui-development.md` | ux | Fork design-system guidance. |

## Planned Fork Areas

Created by their owners; listed now so a merge never overwrites them.

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `native/Cargo.toml`, `native/uar-mobile/**`, `native/.cargo/**` | rust-ffi | Single native Rust link unit embedding universal-agent-runtime. |
| `modules/uar-runtime/**`, `packages/uar-bridge/**`, `scripts/rust/**` | rust-ffi | Native module, TypeScript bridge and xcframework/jniLibs builds. |
| `native/boss-link/**` | p2p | iroh transport and device roster. |
| `docs/webrtc/**` | p2p | boss-link cross-device sync design. Not yet listed in `routing.md`; the lead confirms. |

## Team, Process And Tooling

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `.agent-team/**` | lead | Team definition, routing and exports; role subdirectories (`upstream/`, `product/`, `reviews/…`) belong to their roles. |
| `.claude/agents/boss-mobile-*`, `.claude/commands/opsx/**`, `.codex/**`, `.opencode/**`, `.kimi-code/**` | lead | Native agent definitions and commands (PD-9: committed). Upstream's project skills under `.agents/skills/` stay unchanged. |
| `AGENTS.md` managed regions | lead | Keep fork regions between their markers; take upstream's prose outside them. |
| `.kbd-orchestrator/**`, `.prometheus/**`, `.compass/**`, `compass-out/` reports | lead | KBD state, session logs, Compass configuration and reports (PD-9). |
| `openspec/config.yaml`, `openspec/changes/rebrand-*/**` | lead (tasks, design); product (proposal, specs) | Rebrand phase changes. |
| `docs/guides/local-builds.md`, `docs/guides/cloud-releases.md` | release | Reporting switch, accounts and build profiles for the fork. |
| `docs/README.md` rows for fork documents | lead | Keep fork rows when upstream edits the index. |
| `versions.toml` | operator | Operator-owned pins; never edited by agents. |

## Upstream Tooling

| Path or pattern | Owner | Notes |
| --- | --- | --- |
| `docs/contrib/**` | upstream | This ledger, the playbook and the merge log. |
| `desktop-sync-manifest.json`, `scripts/desktopSyncAudit.ts` | upstream | Desktop semantic-port baselines and audit; mobile checkout identity is `the-boss-mobile`. |
| `scripts/publishGitcodeRelease.ts` (opt-in guard) | release | Publishes to upstream's GitCode repository; refuses to run without `BOSS_ALLOW_GITCODE_PUBLISH=1`. |
| `patches/**` | upstream | Rebuilt or dropped when upstream bumps a patched dependency. |
| `.gitattributes` | upstream | Line-ending and whitespace rules. |
| `scripts/brandCheck.ts`, `scripts/__tests__/brandCheck.test.ts` | release | `pnpm brand:check` and its test. |
| `scripts/brand-allowlist.json` | upstream | Entries added during merges; every change reviewed by security. |
| `.github/workflows/pr-ci.yml` (Brand Check step) | release | Runs `pnpm brand:check` on pull requests. |
