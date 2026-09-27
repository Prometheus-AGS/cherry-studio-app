ASSESSMENT: rebrand-the-boss-mobile-ui
Project: Cherry Studio Mobile (to become The Boss / the-boss-mobile)
Date: 2026-09-26
Codebase baseline: `origin/main` at `95e80515` (local checkout `main` is one commit behind at `98139ac9`; line refs taken from the working tree) (Expo / React Native, pnpm workspace, Uniwind + CherryUI); lint, typecheck and test green on the last PR run; branding is Cherry Studio everywhere, with no central branding module.
Cross-tool progress: none (first phase; `progress.json` 0/0; no other tool has recorded work)

Method: four read-only surveys (mobile branding inventory; mobile vs desktop design system; the-boss rebrand
record; repository-rename impact), plus the phase goals and the operator decision recorded in `goals.md`
(use The Boss desktop identifiers). Counts below come from those surveys; file:line references are
representative, not exhaustive.

## 1. Implementation Completeness

| Area | Status | Evidence |
| --- | --- | --- |
| Central branding module | MISSING | Product name is hardcoded in `app.json`, locale key `common.cherryStudio` (read by `src/frontend/features/settings/about/AboutScreen.tsx:97`), `src/frontend/appShell/fileExport/exportBrand.ts` (`brandName` + base64 logo), `AnalyticsService.ts:23-25`, `src/backend/utils/defaultAppHeaders.ts:4-5`. Desktop equivalent: `the-boss:src/shared/utils/branding.ts` (14 exports) |
| App identity (name, slug, scheme, bundle/package, app groups, extensions) | MISSING | `app.json`: name `Cherry Studio`, slug `cherry-studio`, scheme `cherrystudio`, iOS `com.cherryai.cherrystudio-app`, Android `com.cherryai.cherrystudio_app`, app group `group.com.cherryai.cherrystudio-app`, widget `…ExpoWidgetsTarget`; `app.config.ts` derives `.dev`/`.preview` suffixes, scheme `cherrystudio${suffix}`, `CherryShareExtension` |
| Identity embedded in config plugins and native modules | MISSING | `scripts/withSystemIntegration.js` (`CFBundleDisplayName: 'Cherry Studio'`, `CherryShareExtension`, `CherrySystemIntegrationGroup`, `CherryShareViewController`); `modules/system-integration/ios/Core/CherryStrings.swift:11-13` ("Share to Cherry"); `modules/crash-reporting` keys; podspec descriptions |
| Permission / usage strings in `app.json` | MISSING | 13 lines / 14 occurrences name "Cherry Studio" (calendar, HealthShare/Update, LocalNetwork, camera, location/motion, photos) |
| User-visible locale strings | MISSING | 13 locales under `src/frontend/i18n/locales/`; 30 lines containing "Cherry" per locale (21 "Cherry Studio", 9 short "Cherry"; 32 occurrences), including `agent.default.name` "Cherry Agent" / zh "Cherry 小助手"; plus 2 painting-template locale files |
| Native localized resources (outside `pnpm i18n:check`) | MISSING | `modules/system-integration/ios/Resources/SystemIntegration.xcstrings` (8 hits), `modules/system-integration/android/src/main/res/values/strings.xml` and `values-zh/strings.xml` (3 each: `cherry_share_title` "Share to Cherry", "Continue in Cherry"). Android covers en + zh only; iOS catalog locales to be enumerated. Share sheet / extension would keep "Cherry" even after all JSON locales pass |
| Translation glossary | MISSING | `scripts/i18nGlossary.json:2` lists "Cherry Studio" under `doNotTranslate`; must become "The Boss" before any translation work |
| User-facing links | MISSING | `https://cherry-ai.com` 30× across 22 files in `src` and `app.json` (docs, favicon, locale value `settings.fontSize.previewMarkdown`), `CherryHQ/cherry-studio-app/issues/new/choose`, `issues/1060`; support@cherry-ai.com in `AboutScreen.tsx:22-29`. Map to branding-module constants (website, docs, issues, support) |
| User-visible strings outside i18n | MISSING | Agent tool descriptions (`src/backend/ai/agent/tools/agentManagementTools.ts:102-153`), device-name fallback "Cherry Studio Mobile" (`DesktopConnectionRuntime.ts:348`), Feishu/DingTalk client names, GitHub token URL `name=Cherry%20Studio` (`githubPlugin.ts:38`) |
| App icon, adaptive icon, splash, notification icon, in-app logos | MISSING | `assets/icon.png`, `adaptive-icon.png` (bg `#F65D5D`), `cherry-studio-logo.png`, `cherry-studio-splash-logo.png/.svg`; onboarding LogoDraw vector paths (`src/frontend/features/onboarding/components/LogoDraw/`); export watermark base64 logo |
| Brand source assets | PARTIAL (external) | Vector sources exist outside both repos: `/Users/gqadonis/Projects/know-me/cherry-studio/docs/branding/` (icon light/dark SVGs viewBox 48, lockup, wordmark, `branding-guide.html` v2.2). the-boss has rasters only (`build/icons/*` up to 1024², RGB without alpha) |
| Design tokens (color) | MISSING | Mobile: Vercel/Geist grey ramp, green primary `oklch(0.5175 0.1453 147.65)` / dark `oklch(0.731 0.2158 148.29)`, `--brand #ff5757`, green `--control-active`, pure-black dark background. Desktop v2.2: ember primary `--cs-brand-500` `oklch(0.6196 0.1888 35.2)` light / `--cs-brand-400` `oklch(0.7039 0.1915 37.1)` dark (port the oklch values; the hex `#E04E28` / `#FF6A3D` cited in the rebrand record come from the brand guide, not the token files), brand ramp hue 35.2, cool branded neutrals (bg `#F7F7F8`/`#0B0F14`, surface ladder card → popover), status 500/400 steps |
| Radius / spacing / type scale | PARTIAL | Radius 8px vs desktop 10px (same derivation); no spacing tokens on mobile (desktop `--cs-size-*`); type scales differ (mobile 13–48 ramp tied to accessibility steps in `packages/ui/src/utils/typography-scale.ts`; desktop 12–60) |
| Typography (fonts) | MISSING | Desktop roles: Space Grotesk (display), Inter (UI), Roboto (body), JetBrains Mono (mono/eyebrow) — **not bundled in the-boss either** (falls back to Ubuntu). Mobile bundles only `GeistMono-Regular.ttf` via `expo-font` |
| DESIGN.md | STUB (wrong direction) | Mobile DESIGN.md prescribes Vercel/Geist, green primary and `#ff5757`, all contradicting v2.2. Desktop DESIGN.md ("The Boss Design System") has the surface ladder and paired feedback roles but does **not** document v2.2 values (only CSS comments and `branding-guide.html`) |
| Token pipeline | DONE (reusable) | `packages/design-tokens` hand-authored CSS → `build-native-css.ts` → `native.css` (Uniwind light/dark) with `check.ts` contract; ready to receive new values. `sync-desktop.ts` syncs **icons only** from a local checkout pinned in `packages/design-tokens/src/sync-manifest.json` (upstream `CherryHQ/cherry-studio@9320c745`) |
| README and docs | MISSING | `README.md` 14 Cherry lines (logo, heading, CherryHQ links); `AGENTS.md`/`CLAUDE.md` 3 each; `DESIGN.md` 5; `docs/` 49 files / 242 occurrences; feature READMEs |
| GitHub repository rename | MISSING | `origin` = `Prometheus-AGS/cherry-studio-app`; no `upstream` remote configured |
| Agent team (goal 5) | DONE (untracked) | `.agent-team/boss-mobile/` (13 roles, routing.md, repository-map.md) and native definitions in `.claude/agents`, `.codex/agents`, `.opencode/agents`, `.kimi-code/agents` exist but are **untracked in git**; mapping: rebrand (identity, assets, migration plan), ux (tokens, fonts, DESIGN.md, components), app (locale files, screens, native string resources with rust-ffi/system-integration owner), release (app.json/app.config.ts, EAS, Sentry, package.json), upstream (upstream remote, fork-surface ledger), lead (README/AGENTS docs), security + verifier gates |
| Default agent / assistant names | MISSING | "Cherry Agent" (locale + tool descriptions); desktop renamed to "Boss Assistant" / "Boss Support" (zh "Boss 助手" / "Boss 支持") |

## 2. Spec Alignment

- No OpenSpec specs exist (`openspec/specs/` empty); the phase goals and the operator decision are the spec.
- Desktop prior art that defines "done" for a rebrand: `the-boss:openspec/changes/rebrand-001…009` +
  `0075` and `the-boss:docs/contrib/upstream-merges.md` (naming table; "values that are NOT branding"; rule:
  *a historical value used for detection is input, not identity*).
- Goal 4 ("only UI/UX, styles; port desktop behaviour only where it changed but remains common with
  upstream") maps to these desktop changes: Brand v2.2 tokens (`primitive.css`, `providers.css`), type roles
  (`font.css`), logo/icons, product-name strings, default assistant names, window/app titles, user-facing
  links. The v2.2 commit (`the-boss` `251b3512fd`) changed token files, `font.css`, logo/icons and strings; the survey found no `packages/ui` component changes in it (not exhaustively verified across all rebrand commits), so no component port is implied.

## 3. Cross-Tool Progress

None. No change is IN_PROGRESS by another tool; no blockers reported.

## 4. Build Health

**PASS (inferred, not re-run in this stage):** PR #1 (docs only) passed remote `lint`, `typecheck`, `test`
against `main` on 2026-09-26. Not run locally: `pnpm design:check`, `pnpm i18n:check`,
`pnpm ui:check-boundaries` — required gates for this phase's changes.

## 5. Constraint Compliance (from `.kbd-orchestrator/constraints.md`, AGENTS.md)

Constraints this phase will stress:

- **i18n-complete (blocking):** every changed string must be translated into all 13 locales in the same change.
- **upstream-skills-unchanged, ui-platform-boundaries, design-tokens-consistent (blocking):** CherryUI and
  token changes must pass `pnpm ui:check-boundaries` and `pnpm design:check`.
- **Upstream mergeability:** mobile is a fork of `CherryHQ/cherry-studio-app`; the desktop lesson is to
  centralize identity so merges conflict in one place. A blanket search-and-replace would violate this.
- **Agent tooling in the repo:** goal 5 relies on the untracked `.agent-team/` and native agent files; AGENTS.md
  says personal agent preferences belong in user-level configuration. Decide whether the team files are
  committed (project tooling) or stay local before the team's work lands in PRs.

## 6. Test Coverage

- No tests assert branding today. `scripts/__tests__/desktopSyncAudit.test.ts:265-434` fixtures depend on the
  root package name `cherry-studio-app` (renaming it breaks `pnpm desktop:sync:audit` unless both change
  together). `publishGitcodeRelease.ts` and its test target upstream's GitCode.
- A branding regression guard does not exist (desktop learned this: 42 non-English Cherry strings reappeared
  after upstream merges).

## Gaps, Risks And Open Questions

### Identity and data-compatibility risks (HIGH)

1. **New store identity.** Operator decision: use desktop identifiers (`tools.know-me.the-boss`). The app becomes
   a different App Store / Play listing; existing Cherry installs do not upgrade in place. `eas.json`
   `ascAppId 6809783714`, EAS `projectId 80096eaf…`, Sentry `cherryai/cherry-studio-app` all belong to
   **upstream's** accounts and must be replaced with Know Me Tools accounts — the operator must supply them.
2. **Android package cannot contain hyphens.** `tools.know-me.the-boss` is invalid on Android; proposal
   `tools.know_me.the_boss` needs operator confirmation (recorded in `goals.md`).
3. **Internal identifiers that affect data and interoperability must NOT be renamed blindly** — the desktop
   treated them as technical contracts: `@cherrystudio/*` packages (10 workspace + external analytics client),
   MMKV ids (`cherry-cache-persist`, `cherry-backend-cache-persist`, `cherry-remote-agent-commands`),
   `cherry.db`, backup `product: 'cherry-mobile'` and archive names, `cherry://file/` URIs (persisted in
   content), crash-reporting folders, notification ids, remote-protocol constants shared with the desktop
   (`_cherry-remote._tcp`, `cherry-remote-noise-xx-v1`, `cherry-studio-pair`), Nitro module `CherryStudioUI`.
   Because the bundle identifier changes (a fresh install), storage continuity is not a concern for existing
   users of *this* fork, but renaming these still costs upstream-merge conflicts for no user-visible gain.
4. **URL scheme (explicit decision needed).** Keep `cherrystudio` (desktop parity — `the-boss:electron-builder.yml:18-21` still registers it — and existing OAuth app registrations) or move to a The Boss scheme. **OAuth callback schemes.** `cherrystudio://plugins/github/callback` and the Notion equivalent are hardcoded
   (`githubOauth.ts:22-24`, `notionCredentials.ts:27-29`) and registered with upstream's OAuth apps; the notion
   `client_uri` points at our repo URL. Changing the scheme requires OAuth app registrations under Know Me
   Tools. The desktop kept `cherrystudio://`.
5. **Analytics and headers** (`CherryStudioMobile`, `cherry-studio-ios/android`, `X-Source: cherry-studio`)
   report into upstream analytics; decide retarget or disable.

### Design risks (MEDIUM)

6. **No vector sources in either repo.** Icons, splash and adaptive-icon foreground must be generated from
   `know-me/cherry-studio/docs/branding/` SVGs (external path); the desktop's first port used degraded rasters
   and had to redo them. Android adaptive icon needs a transparent, safe-zone-padded foreground.
7. **Fonts are not vendored anywhere.** Four families (Space Grotesk, Inter, Roboto, JetBrains Mono) must be
   downloaded as static TTFs with licenses, added to `expo-font`, and require a native rebuild. Decide whether
   JetBrains Mono replaces Geist Mono and whether Roboto is needed on mobile.
8. **Type scale conflict.** Mobile's scale drives accessibility text-size steps; adopting the desktop scale
   wholesale would regress accessibility. Port font roles and weights, keep the mobile scale unless product
   decides otherwise.
9. **Desktop inconsistency to avoid copying.** the-boss user theme default is still Cherry green `#00b96b`
   (`preferenceSchemas.ts:879`), overriding ember at runtime (unverified in the running app). Mobile has no
   runtime primary color, so it should take v2.2 values directly.
10. **DESIGN.md must be rewritten** for v2.2; the desktop DESIGN.md does not record v2.2 values, so mobile's
    DESIGN.md becomes the first written v2.2 spec — coordinate with the desktop team to keep one source.

### Repository risks (MEDIUM)

11. **GitHub rename is outward-facing:** GitHub redirects old URLs, but update README/About links,
    `.github/ISSUE_TEMPLATE/*`, `docs/guides/development.md`, podspec metadata, and the local workspace file if
    the directory is also renamed. `the-boss:docs/webrtc/*` also names the old repository; that is a change in
    another repository and belongs to a desktop-side follow-up, not this phase.
12. **Root package name** is coupled to `desktopSyncAudit` fixtures; rename both or keep `cherry-studio-app`.
13. **`publishGitcodeRelease.ts`** publishes to upstream's GitCode; retire or guard it.

### Scope boundary

In scope: identity, icons/splash/logos, tokens, fonts, DESIGN.md, strings in all locales, default agent names,
README/docs, repo rename. Out of scope (goal 4): the-boss-only features (Prometheus integration, UAR, P2P),
service endpoints/updater infrastructure, component redesign.

### Suggested ordering for analyze/plan (desktop lessons)

(Optional, separate decision: add the `upstream` remote and merge upstream before rebranding, as the desktop did — not required by any goal.) Glossary → branding module → identity (after store/Sentry/EAS accounts exist) → assets →
tokens + fonts + DESIGN.md → strings (values, never keys) → README/docs → repo rename → branding regression
guard covering JSON locales **and** native resources (`.xcstrings`, Android `res/values*/strings.xml`),
`app.json` usage strings and config plugins, with an allowlist for kept service names and contracts.
(Optional: `merge-tree` dry run against upstream.)

## Sycophancy Review

Not run: the `sycophancy-correction` MCP tool is not available in this session. Self-check: S-03 satisfied
(13 risks listed; revised after adversarial review — see below); build health marked inferred, not claimed as verified.

## Adversarial Review

Reviewed by an independent critic (read-only, spot-checked facts against both repositories). Verdict on the
first draft: 1 CRITICAL, 4 WARNING, 3 NOTE. All addressed in this revision:

- CRITICAL — native localized resources (`.xcstrings`, Android `strings.xml`) missing from the inventory:
  added a row and extended the regression guard to cover them.
- WARNING — goal 5 not assessed: agent-team row added (present, untracked; role mapping).
- WARNING — user-facing links under-inventoried: links row added (30 `cherry-ai.com` occurrences, 22 files).
- WARNING — i18n glossary still lists "Cherry Studio" as do-not-translate: glossary row added, ordered first.
- WARNING — scope creep (upstream sync, `merge-tree`, editing the-boss docs): marked optional or moved out of
  this phase.
- NOTE — counts corrected (30 lines per locale; 13 permission lines); oklch values cited from token files;
  baseline commit clarified; component-port claim qualified.
