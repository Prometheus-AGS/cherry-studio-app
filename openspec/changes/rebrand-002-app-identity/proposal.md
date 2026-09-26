# rebrand-002-app-identity: native app identity and permission copy

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

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

