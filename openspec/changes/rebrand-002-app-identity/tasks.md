# Tasks

- [x] 1. [release] Check whether `pnpm build:local` needs a linked EAS projectId; keep it only if required, otherwise remove upstream EAS projectId and ascAppId
- [x] 2. [release] Update app.json/app.config.ts identity: name The Boss, slug the-boss-mobile, iOS tools.know-me.the-boss, Android tools.know_me.the_boss, app groups, widget/share-extension ids, scheme theboss (+ -dev/-preview)
- [x] 3. [release] Turn off Sentry upload and error reporting and all analytics reporting (operator decision deferred)
- [x] 4. [app] Turn off GitHub and Notion plugin sign-in (flows hidden/disabled, code kept) pending The Boss identity services
- [x] 5. [rebrand] Rebrand and localize the 13 permission/usage strings into all 13 app locales
- [x] 6. [rebrand] Rebrand config-plugin visible text (share extension display name) and notification icon path
- [x] 7. [lead] Write docs/backend-services/ notes: every Cherry-operated service, account and identity dependency the future The Boss backend must replace
- [ ] 8. [security] Security gate: identity, entitlements, disabled Sentry/analytics/sign-in
- [ ] 9. [verifier] Clean prebuild iOS/Android; install alongside Cherry Studio; deep links open The Boss
