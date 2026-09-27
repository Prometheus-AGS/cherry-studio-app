import { APP_LANGUAGES } from '@/shared/utils/languages';

import { getPrivacyPolicyUrl } from '../privacyPolicy';

it('has no policy URL until The Boss publishes its own page', () => {
  for (const { value } of APP_LANGUAGES) expect(getPrivacyPolicyUrl(value)).toBeUndefined();
});

it.each(['en-US', 'de-DE', 'tr-TR', 'not-a-language'])('returns no URL for %s', (language) => {
  expect(getPrivacyPolicyUrl(language)).toBeUndefined();
});
