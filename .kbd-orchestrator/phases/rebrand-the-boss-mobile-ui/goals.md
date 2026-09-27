# Goals

- Rebrand the application and project as The Boss (the-boss-mobile): product name, app identity, icons, splash, and every user-visible string in every supported locale, following the-boss desktop naming table
- Rename the GitHub repository Prometheus-AGS/cherry-studio-app to the-boss-mobile and update remotes, links and README documentation to match
- Match the-boss desktop design system: typography, color tokens (Brand Guide v2.2), spacing, radii, iconography and component styling across packages/design-tokens, packages/ui (CherryUI), Uniwind styles and screens
- Scope limit: UI/UX, styles and branding only; port desktop behaviour only where it changed but remains common with upstream functionality; new the-boss-only features are deferred
- Execute through the boss-mobile agent team (lead routing; rebrand, ux, app, release, upstream roles; verifier and security gates) with upstream-merge-friendly seams (single branding module)

# Decisions

- 2026-09-26 (operator): use the same package names and Apple identifiers as The Boss desktop
  (`APP_ID = 'tools.know-me.the-boss'`, `the-boss:src/shared/utils/branding.ts`, `electron-builder.yml` `appId`).
  - iOS `bundleIdentifier`: `tools.know-me.the-boss` (valid as-is); derived IDs follow it
    (`tools.know-me.the-boss.ExpoWidgetsTarget`, `group.tools.know-me.the-boss*`), with the existing
    build-profile suffixes.
  - Android `package`: hyphens are not valid in Android application IDs, so the literal desktop value cannot be
    used. Open question for plan: confirm `tools.know_me.the_boss` (closest valid form) or another operator choice.
  - Consequence: new store identities (the app installs alongside the current Cherry Studio build; existing
    installs do not upgrade in place).
