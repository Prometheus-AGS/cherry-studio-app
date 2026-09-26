# rebrand-008-strings-native: native localized resources and share extension

Phase: `rebrand-the-boss-mobile-ui` — plan: `.kbd-orchestrator/phases/rebrand-the-boss-mobile-ui/plan.md`
(decisions PD-1 … PD-13 apply).

## Why

Part of rebranding Cherry Studio mobile as The Boss (the-boss-mobile) at UI/UX and brand parity with The Boss
desktop (`/Users/gqadonis/Projects/prometheus/the-boss`), without porting desktop-only features.

## What Changes

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

