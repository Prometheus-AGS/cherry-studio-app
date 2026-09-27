/**
 * The published privacy policy, in the language the app is being read in.
 *
 * The Boss does not yet have its own privacy policy page: upstream's
 * `cherryai.com.cn` page belongs to Cherry Studio's operator, not Know Me
 * Tools, so it must not be linked from this app. Returns `undefined` until a
 * Know Me Tools policy URL exists (set it in `src/shared/branding` when it
 * does). Every consumer must treat `undefined` as "render no link" rather
 * than falling back to any other address.
 */
export function getPrivacyPolicyUrl(_language: string): string | undefined {
  return undefined;
}
