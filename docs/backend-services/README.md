# Backend Services Replacement Notes

Status: **planning input, not implemented.** Written 2026-09-26 during phase `rebrand-the-boss-mobile-ui`.

The Boss will replace every Cherry-operated service and account with its own identity management and
backend. This document lists what the mobile app depends on today, what the rebrand phase turned off, and what
the future backend must provide. It is an inventory for planning; it does not describe current behavior of
new services.

## Turned Off In The Rebrand Phase

| Integration | Where | State after rebrand | Needed from The Boss backend |
| --- | --- | --- | --- |
| Sentry error reporting and crash upload | `src/frontend/appShell/observability/*` (`configureSentry.ts`, `reportingServices.json`), `app.json` Sentry plugin (org `cherryai`, project `cherry-studio-app`), `EXPO_PUBLIC_SENTRY_DSN`, native `CherryCrashReporting*` flag | Off (operator decision deferred) | Decide: self-hosted Sentry / GlitchTip / own crash pipeline; DSN per environment; source-map/debug-symbol upload in release CI; privacy notice |
| Analytics | `src/backend/services/analytics/AnalyticsService.ts` (`@cherrystudio/analytics-client`, channels `cherry-studio-ios/android`), expo `observe`/`insights` in `reportingServices.json` | Off | Event/usage analytics endpoint owned by The Boss (or none); consent model; token-usage reporting schema if kept |
| GitHub plugin sign-in | `src/backend/services/builtInMcp/plugins/github/*` (`EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID`, callback `cherrystudio://plugins/github/callback`) | Off | The Boss identity provider brokering third-party OAuth, or a The Boss-registered GitHub OAuth app with `theboss://` callbacks |
| Notion plugin sign-in | `src/backend/services/builtInMcp/plugins/notion/*` (`notionCredentials.ts`, `notionOauth.ts` `client_uri`) | Off | Same as GitHub; Notion public integration registered to Know Me Tools |

## Still Pointing At Cherry-Operated Services (not branding; review before release)

| Dependency | Where | Notes for the backend plan |
| --- | --- | --- |
| CherryIN model gateway (`open.cherryin.net`, `open.cherryin.ai`) | `packages/provider-registry/src/providers/cherryin.ts`, `packages/ai-sdk-provider/src/cherryin-provider.ts` | A provider users may choose; kept as a technical contract (same as desktop). A The Boss model gateway (e.g. liter-llm based) would be a new provider, not a rename |
| CherryAI provider id | provider registry, model-picker badges | As above |
| Privacy policy and docs links (`cherry-ai.com`, `docs.cherry-ai.com`, `cherryai.com.cn`) | `src/frontend/appShell/privacy/privacyPolicy.ts` and remaining links | Needs The Boss privacy policy, terms and documentation hosting; `src/shared/branding` holds the website URL |
| Support email | `src/shared/branding` (`support@know-me.tools`) | Needs a monitored support channel |
| Built-in cloud MCP connectors (Feishu, DingTalk, WeCom, Amap) | `src/backend/services/builtInMcp/plugins/*` | Use vendor cloud endpoints with client credentials/OAuth apps that were registered by upstream. Each needs a Know Me Tools app registration or brokering through The Boss identity service |
| EAS project and App Store Connect app | `app.json` `extra.eas.projectId`, `eas.json` `ascAppId` | Upstream's accounts; replace with Know Me Tools EAS project and App Store / Play listings for `tools.know-me.the-boss` / `tools.know_me.the_boss` |
| GitCode release publishing | `scripts/publishGitcodeRelease.ts` | Publishes to upstream's GitCode; retired or guarded in rebrand-010 |

## Capabilities The Future Backend Should Cover

1. **Identity:** user accounts, device enrollment, sign-in for mobile and desktop, third-party OAuth brokering
   (GitHub, Notion, Feishu, DingTalk, WeCom) so client secrets never ship in apps.
2. **Device link infrastructure:** relays and the content-free push gateway described in
   [Cross-Device Sync And Remote Control](../webrtc/README.md).
3. **Observability:** crash and error reporting, optional analytics with consent.
4. **Distribution:** app-store accounts, update channels, release notes source.
5. **Content:** website, documentation, privacy policy, terms, support.
6. **Optional model gateway:** a The Boss provider endpoint for users who do not bring their own keys.
