import {
  ANDROID_PACKAGE,
  APP_ID,
  APP_SLUG,
  ATTRIBUTION_NAME,
  ATTRIBUTION_URL,
  COMPANY_NAME,
  DOCS_URL,
  EXPORT_WATERMARK_BRAND_NAME,
  ISSUES_URL,
  PRODUCT_NAME,
  REPOSITORY_URL,
  SHORT_NAME,
  SUPPORT_EMAIL,
  URL_SCHEME,
  USER_AGENT_NAME,
  WEBSITE_URL,
} from '../branding';

describe('branding identity', () => {
  test('product identity values are The Boss, never Cherry Studio', () => {
    expect(PRODUCT_NAME).toBe('The Boss');
    expect(SHORT_NAME).toBe('The Boss');
    expect(COMPANY_NAME).toBe('Know Me Tools');
    expect(PRODUCT_NAME).not.toMatch(/cherry/i);
    expect(SHORT_NAME).not.toMatch(/cherry/i);
  });

  test('application identifiers match the operator-approved values', () => {
    expect(APP_ID).toBe('tools.know-me.the-boss');
    expect(ANDROID_PACKAGE).toBe('tools.know_me.the_boss');
    expect(APP_SLUG).toBe('the-boss-mobile');
    expect(URL_SCHEME).toBe('theboss');
  });

  test('the Android package uses underscores because hyphens are invalid there', () => {
    expect(ANDROID_PACKAGE).not.toContain('-');
  });

  test('brand URLs point at fork-owned destinations', () => {
    expect(WEBSITE_URL).toBe('https://the-boss.know-me.tools');
    expect(REPOSITORY_URL).toBe('https://github.com/Prometheus-AGS/cherry-studio-app');
    expect(ISSUES_URL).toBe(`${REPOSITORY_URL}/issues`);
    expect(DOCS_URL).toBe(`${REPOSITORY_URL}#readme`);
    expect(SUPPORT_EMAIL).toBe('support@know-me.tools');
  });

  test('attribution mirrors the product identity and website', () => {
    expect(ATTRIBUTION_NAME).toBe(PRODUCT_NAME);
    expect(ATTRIBUTION_URL).toBe(WEBSITE_URL);
  });

  test('the outbound app identity is space-free for header safety', () => {
    expect(USER_AGENT_NAME).toBe('TheBossMobile');
    expect(USER_AGENT_NAME).not.toMatch(/\s/);
    expect(USER_AGENT_NAME).not.toMatch(/cherry/i);
  });

  test('the export watermark uses the product name', () => {
    expect(EXPORT_WATERMARK_BRAND_NAME).toBe(PRODUCT_NAME);
  });
});
