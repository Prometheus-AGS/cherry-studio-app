PLAN: rebrand-the-boss-mobile-ui
Project: Cherry Studio Mobile → The Boss (the-boss-mobile)
Date: 2026-09-26
OpenSpec available: YES
Changes to implement: 11

Inputs: `assessment.md` (revised after adversarial review), `goals.md` (incl. operator decision to use The Boss
desktop identifiers), `the-boss:openspec/changes/rebrand-001…009`, `the-boss:docs/contrib/upstream-merges.md`,
`.agent-team/boss-mobile/routing.md`.

## Decisions Applied (confirm or override before the named change starts)

| Id | Decision | Plan default | Needed by |
| --- | --- | --- | --- |
| PD-1 | Apple identifiers | `tools.know-me.the-boss` (operator decision); derived: `.ExpoWidgetsTarget`, `.ShareExtension`, `group.tools.know-me.the-boss[.system-integration]`; `.dev` / `.preview` suffixes kept | rebrand-002 |
| PD-2 | Android package | `tools.know_me.the_boss` (hyphens are invalid on Android) — **operator confirmation required** | rebrand-002 |
| PD-3 | URL scheme | Target `theboss` (+ `-dev`/`-preview`). The GitHub and Notion OAuth callbacks (`cherrystudio://plugins/*/callback`) are registered on **upstream's** OAuth apps, so the scheme can only move once Know Me Tools OAuth apps exist (PD-4b). Until then keep `cherrystudio`; the old Cherry app and The Boss installed on one phone then both claim the scheme, so the OAuth callback test with both apps installed is part of rebrand-002 acceptance and the collision is a known risk | rebrand-002 |
| PD-4b | OAuth apps | GitHub and Notion plugin OAuth client ids belong to upstream; operator registers Know Me Tools OAuth apps with `theboss://` callbacks, then rebrand-002 switches scheme and client ids | rebrand-002 |
| PD-4 | Store/observability accounts | EAS `projectId`, `ascAppId`, Sentry org/project currently belong to upstream. Until the operator supplies Know Me Tools values: remove upstream EAS/ASC ids, disable Sentry upload and analytics reporting to upstream. Keep the EAS `projectId` if `pnpm build:local` requires a linked project, until a Know Me Tools project exists (checked first in rebrand-002) | rebrand-002 |
| PD-5 | Internal technical contracts | Kept: `@cherrystudio/*` packages, MMKV ids, `cherry.db`, backup `product`/archive names, `cherry://file/`, crash-reporting paths, notification ids, remote-protocol constants, Nitro module names (desktop rule: "a historical value used for detection is input, not identity") | all |
| PD-6 | Naming table | Cherry Studio → The Boss; Cherry → The Boss (short); Cherry Agent → Boss Agent (zh `Boss 助手` style per desktop: keep locale word order, swap only the name); service names CherryIN / CherryAI unchanged | rebrand-001, -007, -008 |
| PD-7 | Root package name | Rename `cherry-studio-app` → `the-boss-mobile` together with `scripts/desktopSyncAudit.ts` and its test fixtures in one commit | rebrand-010 |
| PD-8 | Type scale | Keep the mobile scale (it drives accessibility text-size steps); port font roles, families and weights only | rebrand-005 |
| PD-9 | Agent-team files | Operator decides whether `.agent-team/` and native agent definitions are committed as project tooling; this phase's PRs exclude them until decided | before first PR |
| PD-11 | Spacing and iconography | Excluded: Brand v2.2 (`the-boss` `251b3512fd`) changed color, fonts, logo and strings but not spacing or the icon set (both apps use the same icon family; mobile icons already sync from desktop sources). **Operator sign-off requested** | rebrand-004 |
| PD-12 | Native share-extension locales | Goal 1 requires every supported locale: extend `SystemIntegration.xcstrings` and Android `values-*` from en/zh to all 13 app locales | rebrand-008 |
| PD-13 | Links before the rename | Changes before rebrand-010 keep pointing at the current repository URL; rebrand-010 switches them | rebrand-001, -009 |
| PD-10 | Upstream sync before rebrand | Optional and out of scope for this phase (not a goal); the upstream remote is added read-only in rebrand-010 | — |

Out of scope (goal 4): the-boss-only features (Prometheus integration, UAR, P2P), updater/service endpoints,
component redesign, `the-boss:docs/webrtc/*` link updates (desktop-side follow-up).

## CHANGE LIST (ordered)

1. **rebrand-001-branding-module**: single identity module and glossary
   - Scope: shared | ui | backend
   - Depends on: NONE
   - Owner / agent: `boss-mobile-rebrand` (module, then drives) with sequential consumer edits by `boss-mobile-app`
     (backend/frontend features) and `boss-mobile-ux` (`src/frontend/appShell/fileExport/exportBrand.ts`) — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH (every later change reads from it)
   - Details: Create `src/shared/branding/` mirroring `the-boss:src/shared/utils/branding.ts`: `PRODUCT_NAME`,
     `SHORT_NAME`, `COMPANY_NAME`, `APP_ID`, `APP_SLUG`, website / docs / support / issues / repository URLs,
     attribution name and headers, export watermark brand. Route consumers through it: About screen, export
     watermark (`exportBrand.ts`), `defaultAppHeaders.ts`, `AnalyticsService` app name, device-name fallback
     (`DesktopConnectionRuntime.ts:348`), GitHub token URL name, Feishu/DingTalk client names. Update
     `scripts/i18nGlossary.json` (`doNotTranslate`: "The Boss"; keep CherryIN, CherryAI). No identifier or
     storage renames (PD-5).
   - Acceptance: the consumer files named above contain no product-name or brand-URL literal (they import the
     module); unit test for module exports; `pnpm typecheck`, `pnpm lint` pass. The repository-wide check is
     the phase exit gate (`pnpm brand:check`, rebrand-011).

2. **rebrand-002-app-identity**: native app identity and permission copy
   - Scope: config | native
   - Depends on: rebrand-001, rebrand-003 (notification icon asset); operator input for PD-2, PD-4, PD-4b
   - Owner / agent: `boss-mobile-release` (app.json, app.config.ts, eas.json) + `boss-mobile-rebrand` — Claude Code
   - Est. complexity: M · Complexity score: High · Model class: frontier
   - Customer value: HIGH
   - Details: `app.json`/`app.config.ts`: name "The Boss" (+ " Dev"/" Preview"), slug `the-boss-mobile`, iOS
     bundle `tools.know-me.the-boss`, Android package per PD-2, app groups, widget and share-extension ids,
     scheme per PD-3 (kept until PD-4b, then `theboss` with Know Me Tools OAuth client ids); all 13 permission/usage
     strings rebranded and localized into all 13 app locales (expo `locales` → iOS `InfoPlist.strings`,
     Android resources) to satisfy goal 1; config plugins
     (`scripts/withSystemIntegration.js` display name, `withTabletOrientation.js` visible text only);
     notification icon path; PD-4 account handling (remove upstream EAS/ASC ids, disable Sentry upload and
     upstream analytics) with a documented place to add Know Me Tools values.
   - Acceptance: `expo config` output shows new identity for all three profiles; GitHub and Notion plugin
     authorization completes on a device with only The Boss installed. If PD-4b is resolved (scheme moved to
     `theboss`), it must also complete with the old Cherry app installed; if not, the verifier records the
     observed behavior with both installed as a known limitation; `expo prebuild` (clean) succeeds
     for iOS and Android; development build installs **alongside** the old app on a device; no "Cherry" in
     generated Info.plist / AndroidManifest user-visible fields.

3. **rebrand-003-visual-assets**: icons, splash and in-app logos from brand sources
   - Scope: assets | ui
   - Depends on: rebrand-001, rebrand-004 (`--brand` lives in the token files)
   - Owner / agent: `boss-mobile-rebrand` drives (sources, generation, `assets/`), then `boss-mobile-ux` (tokens,
     `exportBrand.ts`), then `boss-mobile-app` (About screen, onboarding LogoDraw, background-activity
     environment) — sequential, Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH
   - Details: Copy the v2.2 SVG sources (`know-me/cherry-studio/docs/branding/`: icon light/dark, lockup,
     wordmark) into `assets/branding/source/` with provenance. Generate `icon.png` (1024, full-bleed), Android
     adaptive foreground (transparent, safe-zone padded hexagon) + background color, splash image, notification
     icon, in-app logo; replace `cherry-studio-*` asset usages (About, background-activity environment, export
     watermark base64, onboarding LogoDraw paths/palette), `--brand` token value. Keep the CherryIN provider icon.
   - Acceptance: visual check on iOS and Android (light and dark) of home-screen icon, splash, notification,
     About, onboarding animation; no raster upscaling (sources are vector).

4. **rebrand-004-design-tokens**: Brand Guide v2.2 color and radius tokens
   - Scope: packages/design-tokens | ui
   - Depends on: NONE
   - Owner / agent: `boss-mobile-ux` — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH
   - Details: Rewrite `packages/design-tokens/src/styles/{tokens/colors/*, shadcn.css, product.css}` to v2.2 using
     the desktop oklch values (`the-boss:packages/ui/src/styles/tokens/colors/{primitive,providers}.css`):
     ember primary per theme (brand-500 light / brand-400 dark), brand ramp, cool neutrals and surface ladder
     (background → card → popover → sidebar), status 500/400 steps, link, ring, `--control-active` to ember,
     `--radius` 10px. Rebuild `native.css`; update `check.ts` expectations only where the contract changed.
     Do not copy the desktop's runtime `#00b96b` user-theme default.
   - Acceptance: `pnpm design:check` passes, extended with WCAG 2.2 AA contrast assertions (≥ 4.5:1 text,
     ≥ 3:1 UI) computed in `packages/design-tokens/scripts/check.ts` for foreground/primary/link on
     background, card, popover and sidebar in both themes; device screenshots light/dark of home, conversation,
     settings, agent list, model picker sheet and onboarding reviewed by `boss-mobile-verifier` for v2.2
     palette use (not pixel parity with desktop layouts).

5. **rebrand-005-typography**: brand fonts and type roles
   - Scope: assets | tokens | ui
   - Depends on: rebrand-004
   - Owner / agent: `boss-mobile-ux` + `boss-mobile-release` (native rebuild) — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: MEDIUM
   - Details: Vendor static TTFs with licenses: Space Grotesk (display 400/600/700), Inter (UI 400/500/600/700),
     JetBrains Mono (mono 400/500/600, replaces Geist Mono), Roboto (body 400/500 — include for desktop parity,
     or drop if body = Inter is approved at review); register in `expo-font`; add Uniwind font-role variables
     (display, ui, body, mono, eyebrow); apply to heading and text primitives in CherryUI; keep the mobile
     size scale (PD-8).
   - Acceptance: fonts load in development builds on both platforms; Dynamic Type / font-scale steps still work;
     `pnpm ui:check-boundaries` passes; bundle size delta recorded.

6. **rebrand-006-design-doc**: DESIGN.md for The Boss mobile
   - Scope: docs
   - Depends on: rebrand-004, rebrand-005
   - Owner / agent: `boss-mobile-ux` — Claude Code
   - Est. complexity: S · Complexity score: Low · Model class: small
   - Customer value: MEDIUM
   - Details: Replace the Vercel/Geist direction in `DESIGN.md` with the v2.2 system (palette, surfaces, feedback
     roles, fonts and roles, radius, iconography, motion contract unchanged); align `docs/guides/ui-development.md`;
     create `.impeccable.md`. Record that DESIGN.md now documents v2.2 values that the desktop DESIGN.md lacks,
     for the desktop team to adopt.
   - Acceptance: every token named in DESIGN.md exists in `packages/design-tokens`; `pnpm docs:check-links` passes.

7. **rebrand-007-strings-app**: product-name values in all app locales
   - Scope: i18n | backend strings
   - Depends on: rebrand-001
   - Owner / agent: `boss-mobile-app` (locales) then `boss-mobile-runtime` (`src/backend/ai/agent/tools/agentManagementTools.ts`) — Claude Code
   - Est. complexity: M · Complexity score: Medium · Model class: medium
   - Customer value: HIGH
   - Details: Change **values, never keys** in all 13 locales under `src/frontend/i18n/locales/` (30 lines each)
     and the 2 painting-template locales, using the PD-6 naming table and locale word order; default agent name
     ("Boss Agent"); agent tool descriptions in `agentManagementTools.ts`; `cherry-ai.com` links in locale values
     through branding constants where interpolation allows. Keep CherryIN/CherryAI.
   - Acceptance: `pnpm i18n:check` passes; zero "Cherry" in locale values outside the allowlist; spot-check
     zh-cn, ja-jp, de-de rendering on device.

8. **rebrand-008-strings-native**: native localized resources and share extension
   - Scope: native modules
   - Depends on: rebrand-001
   - Owner / agent: `boss-mobile-app` (modules/system-integration) — Claude Code
   - Est. complexity: S · Complexity score: Medium · Model class: medium
   - Customer value: HIGH (share sheet is user-visible)
   - Details: Rebrand `modules/system-integration/ios/Resources/SystemIntegration.xcstrings` (all catalog
     locales), Android `res/values/strings.xml` and `values-zh/strings.xml`, `CherryStrings.swift` fallbacks;
     keep resource keys and Swift/Kotlin type names (PD-5). Extend both catalogs to all 13 app locales (PD-12).
   - Acceptance: share sheet and extension show "The Boss" on iOS and Android in en, zh-cn and ja-jp (device),
     and every catalog locale has a translated value (script check).

9. **rebrand-009-docs-readme**: README and documentation
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

10. **rebrand-010-repo-rename**: GitHub repository becomes `the-boss-mobile`
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

11. **rebrand-011-branding-guard**: regression guard and merge discipline
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

## EXECUTION ROUND ORDER

Team rule: at most two builders active at once; each change has one driving role and co-owners work in
sequence inside it. Only changes with disjoint owned paths run side by side.

- Step 1: rebrand-001-branding-module (rebrand → app → ux, sequential) ‖ nothing else
- Step 2: rebrand-004-design-tokens (ux) ‖ rebrand-007-strings-app (app → runtime)
- Step 3: rebrand-003-visual-assets (rebrand → ux → app), alone
- Step 4: rebrand-008-strings-native (app) ‖ rebrand-005-typography (ux → release; release edits `app.json` fonts only)
- Step 5: rebrand-002-app-identity (release → rebrand), alone — needs PD-2, PD-4, PD-4b answers
- Step 6: rebrand-006-design-doc (ux) ‖ rebrand-011-branding-guard (upstream → release)
- Step 7: rebrand-009-docs-readme (lead → subtree owners), alone
- Step 8: rebrand-010-repo-rename (upstream → co-owners in sequence; operator confirmation), alone

Blocking sign-offs: PD-11 before Step 2 starts rebrand-004; PD-2, PD-4, PD-4b before Step 5; PD-9 before the first PR.

Gates per change: `boss-mobile-verifier` on devices for every user-visible change; `boss-mobile-security` for
rebrand-002 (identity, entitlements, analytics/Sentry) and rebrand-010 (remotes, publishing scripts).
Phase exit: device walkthrough on iOS and Android (light/dark, en/zh/ja) with zero "Cherry" outside the
allowlist, and `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm i18n:check`, `pnpm design:check`,
`pnpm ui:check-boundaries`, `pnpm brand:check` green.

## Risks And Trade-offs

- rebrand-002 cannot fully finish without Know Me Tools EAS / App Store Connect / Sentry accounts; the plan
  disables upstream reporting rather than shipping into upstream's accounts.
- Until PD-4b is resolved, the old Cherry app and The Boss on one phone share `cherrystudio://`; iOS may route
  OAuth callbacks to the wrong app. Tested in rebrand-002; fixed only by the scheme move.
- Keeping internal `cherry*` identifiers means "Cherry" remains in code, schemes and
  storage; this is deliberate for upstream mergeability and OAuth continuity, and is enforced by the allowlist.
- New bundle/package identifiers make this a new app in the stores; there is no in-place upgrade from the Cherry
  build.
- Fonts add bundle size and require a native rebuild; Roboto may be dropped at review.
- The desktop's own v2.2 documentation gap and green user-theme default are not fixed here (desktop follow-up).

## COMMANDS TO RUN

/opsx:new rebrand-001-branding-module
/opsx:new rebrand-002-app-identity
/opsx:new rebrand-003-visual-assets
/opsx:new rebrand-004-design-tokens
/opsx:new rebrand-005-typography
/opsx:new rebrand-006-design-doc
/opsx:new rebrand-007-strings-app
/opsx:new rebrand-008-strings-native
/opsx:new rebrand-009-docs-readme
/opsx:new rebrand-010-repo-rename
/opsx:new rebrand-011-branding-guard

PLAN COMPLETE

## Adversarial Review

Independent critic, first draft: 3 CRITICAL + 1 goal-coverage CRITICAL, 7 WARNING, 2 NOTE. Resolved in this revision:
- 001 acceptance was untestable at its round (repo-wide grep) → limited to its consumer files; repo-wide check moved to phase exit.
- Round parallelism exceeded the two-builder cap and crossed ownership (exportBrand.ts is ux-owned; agentManagementTools.ts is runtime-owned) → sequential steps with named drivers and co-owners.
- Spacing and iconography dropped silently → PD-11 explicit exclusion with sign-off request.
- Warnings: scheme collision and upstream-owned OAuth apps (PD-3, PD-4b, new acceptance test); EAS projectId may be needed for local builds (PD-4); missing dependency edges (002←003, 003←004); native locales narrowed goal 1 (PD-12); fork-surface file under excluded `.agent-team/` (moved to `docs/contrib/`); vague 004 criteria (screens and contrast method named); links to the future repo name (PD-13); brand:check did not cover source literals (added).

Second round (critic re-vet): 4 CRITICAL — 003 edited app-owned screens; Step 4 changes both edited `app.json`;
010 edited paths of five unlisted owners; 002 OAuth criterion contradicted the known collision. Resolved:
co-owners added in sequence, Step 4/5 split so `app.json` has one writer at a time, 010 lists every co-owner,
002 acceptance split by PD-4b outcome. Warnings resolved: PD-11 now blocks rebrand-004; permission strings
localized in 002; allowlist bounded and security-reviewed; 009 subtree owners named.

## Unresolved Review Findings

None open at CRITICAL. Remaining risk accepted by plan: until PD-4b, both apps claim `cherrystudio://` on one
phone (recorded, not fixable without Know Me Tools OAuth apps).

## Operator Decisions (2026-09-26, at /kbd-execute)

| Id | Decision |
| --- | --- |
| PD-2 | Android package `tools.know_me.the_boss` — approved |
| PD-4 | Sentry upload/reporting and analytics **turned off**; decision deferred by operator |
| PD-4b / PD-3 | GitHub and Notion plugin sign-in **turned off** (to be replaced by The Boss identity and backend services). With OAuth disabled nothing depends on `cherrystudio://`, so the scheme moves to `theboss` (+ `-dev`/`-preview`) in rebrand-002. Record everything the future backend must replace in `docs/backend-services/` (task added to rebrand-002) |
| PD-11 | Spacing and iconography exclusion — confirmed |
| PD-9 | Commit the agent team, Compass configuration and reports, `.prometheus/` logs and `.kbd-orchestrator/`. `compass-out/graph.json` (~310 MB) and the SQLite store exceed GitHub's 100 MB file limit and are regenerated by `compass update .`; they are gitignored rather than committed |
