/**
 * Fork identity for The Boss Mobile.
 *
 * Mirrors `the-boss:src/shared/utils/branding.ts` (the desktop app). Every
 * product name, application identifier, brand URL, and outbound-identity
 * literal that distinguishes this fork from upstream Cherry Studio resolves
 * here, so a rebrand touches one file instead of every call site, and
 * upstream merges conflict only here rather than at every literal.
 *
 * Internal technical contracts are out of scope and unchanged here (PD-5):
 * `@cherrystudio/*` packages, MMKV ids, `cherry.db`, `cherry://file/`,
 * crash-reporting paths, notification ids, remote-protocol constants, and
 * Nitro module names keep their existing spellings — a historical value used
 * for detection is input, not identity.
 */

/** Display name shown in-app: About screen, notifications, share sheet. */
export const PRODUCT_NAME = 'The Boss';

/**
 * Short form of {@link PRODUCT_NAME}. Identical today; kept as its own export
 * for callers that need a compact label without depending on the two staying
 * equal.
 */
export const SHORT_NAME = 'The Boss';

/** Vendor name shown to the user and to the OS, e.g. crash-report grouping. */
export const COMPANY_NAME = 'Know Me Tools';

/**
 * iOS bundle identifier / reverse-DNS application id (PD-1, operator-decided).
 * Consumed by `app.config.ts` (owned by boss-mobile-release).
 */
export const APP_ID = 'tools.know-me.the-boss';

/**
 * Android application id. Hyphens are invalid in Android package names, so
 * this differs from {@link APP_ID} by using underscores (PD-2,
 * operator-approved).
 */
export const ANDROID_PACKAGE = 'tools.know_me.the_boss';

/** Expo/EAS slug. */
export const APP_SLUG = 'the-boss-mobile';

/**
 * Base URL scheme, without the `-dev` / `-preview` build-profile suffixes
 * that `app.config.ts` appends (PD-1). The app's *current* registered scheme
 * stays `cherrystudio` until rebrand-002 switches it over per PD-3/PD-4b;
 * that cutover is a build-configuration change owned by
 * boss-mobile-release, not this module.
 */
export const URL_SCHEME = 'theboss';

/** Fork-owned marketing site. */
export const WEBSITE_URL = 'https://the-boss.know-me.tools';

/** This fork's GitHub repository. */
export const REPOSITORY_URL = 'https://github.com/Prometheus-AGS/the-boss-mobile';

/** Issue tracker, derived from {@link REPOSITORY_URL}. */
export const ISSUES_URL = `${REPOSITORY_URL}/issues`;

/**
 * Documentation destination, mirroring the desktop's `DOCS_URL` pattern
 * (`REPO_URL#readme`): this fork has no dedicated docs site yet. Replace
 * with a real docs destination once the backend-services work defines one.
 */
export const DOCS_URL = `${REPOSITORY_URL}#readme`;

/**
 * Support contact, mirroring the desktop's `SUPPORT_EMAIL`. Replaces
 * `support@cherry-ai.com`, a Cherry-operated address this fork does not
 * control.
 */
export const SUPPORT_EMAIL = 'support@know-me.tools';

/** Identifier sent to third-party AI providers for attribution. */
export const ATTRIBUTION_NAME = PRODUCT_NAME;

/** Site sent as `HTTP-Referer` alongside {@link ATTRIBUTION_NAME}. */
export const ATTRIBUTION_URL = WEBSITE_URL;

/**
 * Space-free app identity used in outbound `User-Agent` / `X-App-Name`
 * headers and analytics identification. Replaces `CherryStudioMobile`.
 */
export const USER_AGENT_NAME = 'TheBossMobile';

/** Brand name burned into exported-file watermarks. */
export const EXPORT_WATERMARK_BRAND_NAME = PRODUCT_NAME;
