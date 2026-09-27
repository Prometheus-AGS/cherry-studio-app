/**
 * `pnpm brand:check` — fails when the upstream product name leaks back into user-visible text.
 *
 * Resource files (locale JSON values, native-locale JSON, `.xcstrings`/`.strings` values, Android
 * `strings.xml` values and `app.json`) are user-visible by construction, so any `cherry` occurs
 * there is a finding. Source files (TS/TSX/JS, Swift, Kotlin) hold identifiers too, so only string
 * literals are read, and only the product name (`Cherry` as a word, `Cherry Studio`) and the
 * `cherry-ai.com` site count. Keys and comments are never scanned. `src/shared/branding` is the
 * one place the fork's identity lives and is skipped.
 *
 * Exceptions live in `scripts/brand-allowlist.json`: exact identifiers (optionally scoped to path
 * globs) or path globs, each with a reason. Rules: docs/contrib/upstream-merges.md.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import { pathMatchesGlob } from './desktopSyncAudit';

export interface BrandAllowlistIdentifier {
  identifier: string;
  reason: string;
  paths?: string[];
}

export interface BrandAllowlistPath {
  glob: string;
  reason: string;
}

export interface BrandAllowlist {
  identifiers: BrandAllowlistIdentifier[];
  paths: BrandAllowlistPath[];
}

export type BrandSurface =
  | 'locale'
  | 'native-locale'
  | 'xcstrings'
  | 'strings'
  | 'android'
  | 'app-json'
  | 'source';

export interface BrandFinding {
  file: string;
  line: number;
  surface: BrandSurface;
  /** Resource key path, when the surface has keys. */
  key?: string;
  text: string;
}

export interface BrandCheckReport {
  findings: BrandFinding[];
  scannedFiles: number;
  unusedIdentifiers: string[];
  unusedPaths: string[];
}

interface ScannedValue {
  line: number;
  key?: string;
  text: string;
}

const ALLOWLIST_FILE = 'scripts/brand-allowlist.json';
const SCAN_ROOTS = ['src', 'packages', 'modules', 'scripts', 'assets'];
const ROOT_FILES = ['app.json', 'app.config.ts'];
// Root-level `ios/` and `android/` are prebuild output and are not scan roots; the native sources
// under `modules/*/ios` and `modules/*/android` are scanned.
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', 'build', 'coverage', 'dist']);
/** Paths the contract itself exempts; they are not allowlist decisions. */
const BUILT_IN_EXEMPT_GLOBS = ['src/shared/branding/**', 'scripts/brandCheck.ts', ALLOWLIST_FILE];
const LOCALE_GLOBS = [
  'src/frontend/i18n/locales/*.json',
  'assets/paintings/templates/locales/*.json',
];
const NATIVE_LOCALE_GLOB = 'assets/branding/native-locales/**.json';
const SOURCE_EXTENSION = /\.(?:[cm]?[jt]s|tsx|swift|kts?)$/u;

/** Any spelling of the upstream name: resource values are always user-visible. */
const RESOURCE_PATTERN = /cherry/giu;
/**
 * Product-name uses inside source literals: the capitalised word `Cherry` (case-sensitive, so
 * `CherryIN`, `cherry.db` and `cherry-remote` stay identifiers), the phrase `Cherry Studio` in any
 * case and its hyphenated (`cherry-studio`) and unspaced (`cherrystudio`) spellings, and the
 * upstream sites (`cherry-ai.com`, `cherryai.com`, which also matches as a substring of
 * `cherryai.com.cn`). The unspaced form excludes only the `@cherrystudio/` npm scope form (a
 * handle such as `@CherryStudio` still matches) instead of the allowlist, since that scope is used in import specifiers throughout
 * the tree (PD-5).
 */
const SOURCE_PATTERNS = [
  /(?<![\p{L}\p{N}_])Cherry(?![\p{L}\p{N}_])/gu,
  /cherry\s+studio|cherry-ai\.com|cherryai\.com|cherry-studio|cherrystudio(?!\/)|(?<!@)cherrystudio/giu,
];
const IDENTIFIER_CHARACTER = /[\p{L}\p{N}_]/u;
const WILDCARD_TAIL = /^[\p{L}\p{N}_.\-/]*/u;

function toRepoPath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function matchesAny(repoPath: string, globs: readonly string[]): boolean {
  return globs.some((glob) => pathMatchesGlob(repoPath, glob));
}

export function validateAllowlist(raw: unknown): BrandAllowlist {
  if (!raw || typeof raw !== 'object') throw new Error('allowlist must be a JSON object');
  const { identifiers = [], paths = [] } = raw as Record<string, unknown>;
  if (!Array.isArray(identifiers) || !Array.isArray(paths)) {
    throw new Error('allowlist "identifiers" and "paths" must be arrays');
  }
  const errors: string[] = [];
  const hasReason = (entry: Record<string, unknown>) =>
    typeof entry.reason === 'string' && entry.reason.trim().length > 0;

  identifiers.forEach((entry: Record<string, unknown>, index) => {
    const label = `identifiers[${index}]`;
    if (typeof entry?.identifier !== 'string' || !/^\S+$/u.test(entry.identifier)) {
      // Whitespace would let a phrase such as a product name through; identifiers are single tokens.
      errors.push(`${label}: "identifier" must be a non-empty token without whitespace`);
    }
    if (!hasReason(entry ?? {})) errors.push(`${label}: missing "reason"`);
    if (
      entry?.paths !== undefined &&
      (!Array.isArray(entry.paths) || entry.paths.some((glob) => typeof glob !== 'string'))
    ) {
      errors.push(`${label}: "paths" must be an array of globs`);
    }
    // A bare product word is only acceptable inside named files, never everywhere.
    if (entry?.identifier === 'Cherry' && !Array.isArray(entry.paths)) {
      errors.push(`${label}: the bare word "Cherry" must be scoped with "paths"`);
    }
  });
  paths.forEach((entry: Record<string, unknown>, index) => {
    if (typeof entry?.glob !== 'string' || entry.glob.length === 0) {
      errors.push(`paths[${index}]: missing "glob"`);
    }
    if (!hasReason(entry ?? {})) errors.push(`paths[${index}]: missing "reason"`);
  });
  if (errors.length > 0) throw new Error(`invalid brand allowlist:\n  ${errors.join('\n  ')}`);
  return { identifiers, paths } as BrandAllowlist;
}

export function loadAllowlist(root: string): BrandAllowlist {
  const filePath = path.join(root, ALLOWLIST_FILE);
  return validateAllowlist(JSON.parse(readFileSync(filePath, 'utf8')));
}

/** Character ranges of `text` covered by an allowlisted identifier. */
function identifierRanges(text: string, identifier: string): [number, number][] {
  const isPrefix = identifier.endsWith('*');
  const literal = isPrefix ? identifier.slice(0, -1) : identifier;
  const ranges: [number, number][] = [];
  let start = text.indexOf(literal);
  while (start !== -1) {
    let end = start + literal.length;
    const before = start > 0 ? text[start - 1] : '';
    if (isPrefix) end += WILDCARD_TAIL.exec(text.slice(end))?.[0].length ?? 0;
    const after = text[end] ?? '';
    const bounded =
      !(before && IDENTIFIER_CHARACTER.test(before) && IDENTIFIER_CHARACTER.test(literal[0])) &&
      !(after && IDENTIFIER_CHARACTER.test(after));
    if (bounded) ranges.push([start, end]);
    start = text.indexOf(literal, start + 1);
  }
  return ranges;
}

function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

function lineOfJsonValue(source: string, value: string): number {
  const encoded = JSON.stringify(value).slice(1, -1);
  const offset = source.indexOf(`"${encoded}"`);
  return offset === -1 ? 1 : lineOf(source, offset);
}

function collectJsonStrings(
  node: unknown,
  keyPath: string,
  onString: (key: string, value: string) => void,
): void {
  if (typeof node === 'string') {
    onString(keyPath, node);
  } else if (Array.isArray(node)) {
    node.forEach((item, index) => collectJsonStrings(item, `${keyPath}[${index}]`, onString));
  } else if (node && typeof node === 'object') {
    for (const [key, child] of Object.entries(node)) {
      collectJsonStrings(child, keyPath ? `${keyPath}.${key}` : key, onString);
    }
  }
}

function jsonValues(source: string): ScannedValue[] {
  const values: ScannedValue[] = [];
  collectJsonStrings(JSON.parse(source), '', (key, text) =>
    values.push({ key, text, line: lineOfJsonValue(source, text) }),
  );
  return values;
}

/** String Catalog: only `stringUnit.value` entries are shown; keys and comments are not. */
function xcstringsValues(source: string): ScannedValue[] {
  const values: ScannedValue[] = [];
  const catalog = JSON.parse(source) as { strings?: Record<string, unknown> };
  for (const [key, entry] of Object.entries(catalog.strings ?? {})) {
    collectJsonStrings(entry, key, (keyPath, text) => {
      if (keyPath.endsWith('.stringUnit.value')) {
        values.push({ key: keyPath, text, line: lineOfJsonValue(source, text) });
      }
    });
  }
  return values;
}

function dotStringsValues(source: string): ScannedValue[] {
  const values: ScannedValue[] = [];
  const entry = /"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;/gu;
  for (const match of source.matchAll(entry)) {
    values.push({ key: match[1], text: match[2], line: lineOf(source, match.index ?? 0) });
  }
  return values;
}

function androidValues(source: string): ScannedValue[] {
  const values: ScannedValue[] = [];
  const element = /<(string|item)\b([^>]*)>([\s\S]*?)<\/\1>/gu;
  for (const match of source.matchAll(element)) {
    const name = /\bname="([^"]*)"/u.exec(match[2])?.[1];
    values.push({ key: name, text: match[3], line: lineOf(source, match.index ?? 0) });
  }
  return values;
}

function typescriptLiterals(filePath: string, source: string): ScannedValue[] {
  const kind = /\.[jt]sx$/u.test(filePath) ? ts.ScriptKind.TSX : undefined;
  const file = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, kind);
  const values: ScannedValue[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateLiteralToken(node) ||
      ts.isJsxText(node)
    ) {
      const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
      values.push({ text: node.text, line: line + 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return values;
}

/** String literals of Swift and Kotlin, skipping comments and Kotlin character literals. */
function nativeLiterals(source: string): ScannedValue[] {
  const values: ScannedValue[] = [];
  const closing = (from: number, delimiter: string) => {
    let end = from;
    while (end < source.length && !source.startsWith(delimiter, end)) {
      end += source[end] === '\\' ? 2 : 1;
    }
    return end;
  };
  let index = 0;
  while (index < source.length) {
    if (source.startsWith('//', index)) {
      const end = source.indexOf('\n', index);
      index = end === -1 ? source.length : end;
    } else if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);
      index = end === -1 ? source.length : end + 2;
    } else if (source[index] === "'") {
      index = closing(index + 1, "'") + 1;
    } else if (source[index] === '"') {
      const delimiter = source.startsWith('"""', index) ? '"""' : '"';
      const start = index + delimiter.length;
      const end = closing(start, delimiter);
      values.push({ text: source.slice(start, end), line: lineOf(source, index) });
      index = end + delimiter.length;
    } else {
      index += 1;
    }
  }
  return values;
}

function classify(repoPath: string): BrandSurface | null {
  if (repoPath === 'app.json') return 'app-json';
  if (matchesAny(repoPath, LOCALE_GLOBS)) return 'locale';
  if (pathMatchesGlob(repoPath, NATIVE_LOCALE_GLOB)) return 'native-locale';
  if (repoPath.endsWith('.xcstrings')) return 'xcstrings';
  if (repoPath.endsWith('.strings')) return 'strings';
  if (/(?:^|\/)res\/values[^/]*\/strings\.xml$/u.test(repoPath)) return 'android';
  if (SOURCE_EXTENSION.test(repoPath) && !repoPath.endsWith('.d.ts')) return 'source';
  return null;
}

function readValues(surface: BrandSurface, filePath: string, source: string): ScannedValue[] {
  switch (surface) {
    case 'locale':
    case 'native-locale':
    case 'app-json':
      return jsonValues(source);
    case 'xcstrings':
      return xcstringsValues(source);
    case 'strings':
      return dotStringsValues(source);
    case 'android':
      return androidValues(source);
    case 'source':
      return /\.(?:swift|kts?)$/u.test(filePath)
        ? nativeLiterals(source)
        : typescriptLiterals(filePath, source);
  }
}

function listFiles(root: string): string[] {
  const files = ROOT_FILES.map((name) => path.join(root, name)).filter((file) => existsSync(file));
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(path.join(directory, entry.name));
      } else if (entry.isFile()) {
        files.push(path.join(directory, entry.name));
      }
    }
  };
  for (const scanRoot of SCAN_ROOTS) {
    const directory = path.join(root, scanRoot);
    if (existsSync(directory)) walk(directory);
  }
  return files.sort();
}

function excerpt(text: string): string {
  const collapsed = text.replace(/\s+/gu, ' ').trim();
  if (collapsed.length <= 120) return collapsed;
  const anchor = Math.max(0, collapsed.toLowerCase().indexOf('cherry'));
  const start = Math.max(0, Math.min(anchor - 40, collapsed.length - 120));
  return `${start > 0 ? '…' : ''}${collapsed.slice(start, start + 120)}…`;
}

export function checkBrand(root: string, allowlist: BrandAllowlist): BrandCheckReport {
  const findings: BrandFinding[] = [];
  const usedIdentifiers = new Set<number>();
  const usedPaths = new Set<number>();
  let scannedFiles = 0;

  for (const filePath of listFiles(root)) {
    const repoPath = toRepoPath(root, filePath);
    const surface = classify(repoPath);
    if (!surface || matchesAny(repoPath, BUILT_IN_EXEMPT_GLOBS)) continue;
    const excludedBy = allowlist.paths.findIndex(({ glob }) => pathMatchesGlob(repoPath, glob));
    if (excludedBy !== -1) {
      usedPaths.add(excludedBy);
      continue;
    }

    const source = readFileSync(filePath, 'utf8');
    scannedFiles += 1;
    if (!/cherry/iu.test(source)) continue;

    const identifiers = allowlist.identifiers
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !entry.paths || matchesAny(repoPath, entry.paths));
    const patterns = surface === 'source' ? SOURCE_PATTERNS : [RESOURCE_PATTERN];

    let values: ScannedValue[];
    try {
      values = readValues(surface, filePath, source);
    } catch (error: unknown) {
      throw new Error(`${repoPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    for (const value of values) {
      const matches = patterns.flatMap((pattern) => [...value.text.matchAll(pattern)]);
      for (const match of matches) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const cover = identifiers.find(({ entry }) =>
          identifierRanges(value.text, entry.identifier).some(
            ([from, to]) => from <= start && end <= to,
          ),
        );
        if (cover) {
          usedIdentifiers.add(cover.index);
          continue;
        }
        findings.push({
          file: repoPath,
          line: value.line,
          surface,
          key: value.key,
          text: excerpt(value.text),
        });
        break;
      }
    }
  }

  return {
    findings,
    scannedFiles,
    unusedIdentifiers: allowlist.identifiers
      .filter((_, index) => !usedIdentifiers.has(index))
      .map(({ identifier }) => identifier),
    unusedPaths: allowlist.paths
      .filter((_, index) => !usedPaths.has(index))
      .map(({ glob }) => glob),
  };
}

export function renderReport(report: BrandCheckReport, allowlist: BrandAllowlist): string {
  const summary =
    `scanned ${report.scannedFiles} files; allowlist: ${allowlist.identifiers.length} identifiers, ` +
    `${allowlist.paths.length} path globs`;
  const unused = [...report.unusedIdentifiers, ...report.unusedPaths];
  const unusedLine =
    unused.length > 0
      ? `\n[brand-check] allowlist entries with no match: ${unused.join(', ')}`
      : '';
  if (report.findings.length === 0) return `[brand-check] OK: ${summary}${unusedLine}\n`;

  const lines = report.findings.map(
    ({ file, line, surface, key, text }) =>
      `  ${file}:${line} [${surface}${key ? ` ${key}` : ''}] ${JSON.stringify(text)}`,
  );
  return [
    `[brand-check] ${report.findings.length} upstream product-name leftover(s) outside src/shared/branding:`,
    ...lines,
    '',
    `[brand-check] ${summary}${unusedLine}`,
    '[brand-check] Rename with the Naming table in docs/contrib/upstream-merges.md, or add an exact',
    `[brand-check] identifier or path glob with a reason to ${ALLOWLIST_FILE}.`,
    '',
  ].join('\n');
}

function main(): void {
  const root = path.resolve(__dirname, '..');
  const allowlist = loadAllowlist(root);
  const report = checkBrand(root, allowlist);
  process.stdout.write(renderReport(report, allowlist));
  if (report.findings.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error: unknown) {
    process.stderr.write(
      `[brand-check] ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
