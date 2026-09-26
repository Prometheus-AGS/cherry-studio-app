import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { BrandAllowlist } from '../brandCheck';
import { checkBrand, validateAllowlist } from '../brandCheck';

const temporaryRoots: string[] = [];

function createTree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'brand-check-'));
  temporaryRoots.push(root);
  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = join(root, relativePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, contents);
  }
  return root;
}

function stringCatalog(value: string): string {
  return JSON.stringify(
    {
      sourceLanguage: 'en',
      strings: {
        'share.title': {
          comment: 'Cherry Studio share sheet title (comments are not shown)',
          localizations: { en: { stringUnit: { state: 'translated', value } } },
        },
      },
      version: '1.0',
    },
    null,
    2,
  );
}

const noExceptions: BrandAllowlist = { identifiers: [], paths: [] };

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe('brand check', () => {
  test('fails on the upstream product name in a locale value and an .xcstrings value', () => {
    const root = createTree({
      'src/frontend/i18n/locales/en-us.json': JSON.stringify(
        { 'common.cherryStudio': 'The Boss', 'common.welcome': 'Welcome to Cherry Studio' },
        null,
        2,
      ),
      'modules/share/ios/Resources/Share.xcstrings': stringCatalog('Share to Cherry Studio'),
    });

    const { findings } = checkBrand(root, noExceptions);

    expect(findings).toEqual([
      expect.objectContaining({
        file: 'modules/share/ios/Resources/Share.xcstrings',
        surface: 'xcstrings',
        text: 'Share to Cherry Studio',
      }),
      expect.objectContaining({
        file: 'src/frontend/i18n/locales/en-us.json',
        line: 3,
        key: 'common.welcome',
        text: 'Welcome to Cherry Studio',
      }),
    ]);
  });

  test('passes rebranded values, allowlisted identifiers and identifier-only source literals', () => {
    const root = createTree({
      'src/frontend/i18n/locales/en-us.json': JSON.stringify({
        'common.cherryStudio': 'The Boss',
        'provider.hint': 'Sign in to CherryIN from The Boss',
      }),
      'modules/share/ios/Resources/Share.xcstrings': stringCatalog('Share to The Boss'),
      'src/backend/storage.ts':
        "export const DATABASE = 'cherry.db';\n// Cherry Studio legacy note\n",
      'src/shared/branding/branding.ts': "export const UPSTREAM = 'Cherry Studio';\n",
    });
    const allowlist = validateAllowlist({
      identifiers: [{ identifier: 'CherryIN', reason: 'Consumed service name.' }],
    });

    expect(checkBrand(root, allowlist).findings).toEqual([]);
  });

  test('flags the product word in source literals but not in comments', () => {
    const root = createTree({
      'src/frontend/Header.tsx':
        '// Cherry\nexport const Header = () => <Text>Cherry Studio</Text>;\n',
      'modules/share/ios/ShareView.swift': '// Cherry\nlet title = "Open in Cherry"\n',
    });

    expect(checkBrand(root, noExceptions).findings).toEqual([
      expect.objectContaining({ file: 'modules/share/ios/ShareView.swift', line: 2 }),
      expect.objectContaining({ file: 'src/frontend/Header.tsx', line: 2 }),
    ]);
  });

  test('rejects allowlist entries without a reason or that would exempt a phrase', () => {
    expect(() => validateAllowlist({ identifiers: [{ identifier: 'CherryAI' }] })).toThrow(
      'missing "reason"',
    );
    expect(() =>
      validateAllowlist({ identifiers: [{ identifier: 'Cherry Studio', reason: 'no' }] }),
    ).toThrow('without whitespace');
    expect(() =>
      validateAllowlist({ identifiers: [{ identifier: 'Cherry', reason: 'everywhere' }] }),
    ).toThrow('must be scoped');
  });
});
