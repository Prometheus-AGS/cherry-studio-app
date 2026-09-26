# Consuming Upstream

This guide defines how The Boss Mobile consumes its two upstream sources without losing fork-specific
work: git merges from `CherryHQ/cherry-studio-app`, and semantic ports from the
`CherryHQ/cherry-studio` desktop tracked by [`desktop-sync-manifest.json`](../../desktop-sync-manifest.json).
The Boss desktop (`the-boss`) is a parity reference, not an upstream; parity work is product-owned.

The rebrand concentrates identity in one module so upstream edits to the surfaces around it merge
cleanly. [Fork Surface](./fork-surface.md) lists every path the fork owns and who resolves conflicts
in it. The [merge log](./upstream-merge-log.md) records what each merge actually hit. This page holds
the rules; when the log and this page disagree, this page wins and the log gets a correction.

## Remotes

```bash
git remote add upstream https://github.com/CherryHQ/cherry-studio-app.git
git remote set-url --push upstream DISABLED_read_only_upstream
```

The push URL is deliberately disabled: `git remote add` sets one by default, and pushing to someone
else's repository is never part of this workflow. Adding the remote belongs to the repository-rename
change (rebrand-010); until then it is not configured.

## Merge, Do Not Rebase

```bash
git fetch upstream main
git merge-tree --write-tree HEAD upstream/main   # dry run: lists conflicts without touching the tree
git switch -c merge/upstream-$(date +%F)
git merge --no-ff --no-commit upstream/main
```

- Merge on a `merge/upstream-YYYY-MM-DD` branch with `--no-ff`. Never rebase or cherry-pick shared
  history: a rebase rewrites fork commits and turns one conflict resolution into one per commit.
- Dry-run first. Stop and ask before merging when the working tree has changes the merge would touch,
  or when upstream bumps a dependency that has a file in [`patches/`](../../patches).
- Log every conflict and its resolution in the [merge log](./upstream-merge-log.md) in the same branch.
- Never push upstream. Land on `main` only through the normal pull request flow in
  [Git Workflow](../guides/git-workflow.md).

## Conflict Ownership

On a `merge/upstream-*` branch the upstream role may write any path needed to finish the merge.
A conflict inside a path listed in [Fork Surface](./fork-surface.md) is resolved by that path's owner,
one owner at a time, through a handoff; the upstream role resolves everything else. A path missing
from the ledger is presumed upstream-owned and takes upstream's version unless a test proves the fork
change is required, in which case the path is added to the ledger in the same merge.

## Resolution Rules

| Surface | Rule |
| --- | --- |
| `src/shared/branding/**` | Ours. Upstream has no such module; its literals route here. |
| `app.json`, `app.config.ts` identity | Keep our name, slug, bundle and package ids, scheme, app groups, share-extension display name and `REPORTING_DISABLED`; take upstream's other changes (new plugins, permissions, build settings). |
| `package.json` `name` / `version` | Keep ours / take upstream's. |
| i18n catalogs (`src/frontend/i18n/locales/*`, painting-template locales) | Take upstream's keys and new entries; keep our product-name values. Values, never keys: `common.cherryStudio` is an identifier. New upstream values with the product name are rebranded with the Naming table in every locale. |
| Native catalogs (`assets/branding/native-locales/**`, `SystemIntegration.xcstrings`, Android `res/values*/strings.xml`) | Same values-not-keys rule. Keep resource keys and Swift/Kotlin type names (`cherry_share_*`, `CherryStrings`) as they are. |
| Design tokens | Keep `packages/design-tokens/src/styles/tokens/colors/boss.css` and the deviations in `DEVIATIONS.md`; take upstream's new token names, then rerun `pnpm design:build` and `pnpm design:check`. |
| Generated files | Never hand-merge. Resolve the sources, then regenerate: `pnpm db:generate` (Drizzle migrations), `pnpm design:build` (native CSS), `pnpm ui:icons:generate` (icon registries), `pnpm --filter @cherrystudio/ui native:codegen` (Nitrogen output under `packages/ui/nitrogen/generated/`) and `pnpm exec tsx scripts/branding/generateBrandAssets.ts` (brand artwork). Revert regenerated files whose only diff is a timestamp. |
| `patches/` | Ours. When upstream bumps a patched dependency, rebuild the patch against the new version or delete it if upstream fixed the issue; `pnpm install --frozen-lockfile` fails on a patch that no longer applies. |
| Lockfile | Take upstream's `pnpm-lock.yaml`, re-add fork dependencies with `pnpm install`, then `pnpm dedupe`. |
| Provider and service endpoints | Take upstream's. CherryIN and CherryAI are real services the app consumes. |
| Desktop semantic ports | Follow the `sync-cherry-desktop` skill: audit with `pnpm desktop:sync:audit --desktop-root <path>`, port only admitted consumers, and advance a domain baseline only after its checks pass. |

## Naming

| Upstream | Ours |
| --- | --- |
| Cherry Studio | The Boss |
| Cherry (short product name) | The Boss |
| Cherry Agent | Boss Agent |
| Cherry Assistant (zh `Cherry 助手` / `Cherry 小助手`) | Boss Assistant (zh `Boss 助手`) |
| `cherry-ai.com` links | [`src/shared/branding`](../../src/shared/branding/branding.ts) constants (`WEBSITE_URL`, `DOCS_URL`, `SUPPORT_EMAIL`) |
| `CherryStudioMobile` user agent / app name headers | `USER_AGENT_NAME` from the branding module |

Translations keep the locale's own word order and swap only the name: `Assistant Cherry` becomes
`Assistant Boss`, `Cherry アシスタント` becomes `Boss アシスタント`. `The Boss` is in the i18n glossary's
do-not-translate list. Whoever changes copy translates it into every supported locale in the same
change and runs `pnpm i18n:check`.

Also rebranded: model-facing text (tool descriptions, system prompts, attachment labels), because the
model repeats it to the user; outbound client names (MCP `clientName`, OAuth `client_name`), which
use `ATTRIBUTION_NAME` from the branding module.

Not rebranded: service names the app consumes, comments, log messages, tests and fixtures.

## Values That Are NOT Branding

Some Cherry strings are load-bearing. Renaming them breaks stored data, pairing or builds. The rule,
shared with The Boss desktop: **a historical value used for detection is input, not identity.**

- Internal technical contracts (PD-5): `@cherrystudio/*` package names; MMKV and cache ids
  (`cherry-cache-persist`, `cherry-backend-cache-persist`); the database file `cherry.db` and its
  `-wal`/`-shm` siblings; backup `product` value `cherry-mobile` and archive paths
  (`database/cherry.db`); the `cherry://file/` reference scheme; crash-reporting Info.plist and
  manifest keys (`CherryCrashReporting*`); notification and task ids (`cherry-reply-`, `cherry-task-`,
  `cherry-background-activity`); the export watermark kind `cherry`.
- Remote-protocol constants shared with the desktop: `_cherry-remote._tcp`, `cherry-remote`,
  `cherry-remote-noise-xx-v1`, `cherry-studio-pair`, `cherry-remote-agent-commands`.
- Native module and target names: Nitro `CherryStudioUI`, `CherryMenuView`,
  `CherryBackgroundPressView`; `CherryShareExtension`, `CherryShareViewController`, `CherryStrings`,
  `CherrySystemIntegrationGroup`.
- Service names: CherryIN, CherryAI, and their endpoints.
- Provenance links: `CherryHQ/cherry-studio` and `CherryHQ/cherry-studio-app` repository, raw-content
  and issue URLs that identify where code or data came from (for example the provider-registry update
  sources and desktop-sync tooling).
- `cherrystudio` in history: commit messages, the merge log and archived OpenSpec changes mention the
  old name and scheme; they record what was true, and are never rewritten.

`pnpm brand:check` enforces this split. Its exceptions live in
[`scripts/brand-allowlist.json`](../../scripts/brand-allowlist.json) as exact identifiers or path globs,
each with a reason, reviewed by the security role.

## After Merging

Run the gates on the merge branch before proposing it:

```bash
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm brand:check
pnpm typecheck
pnpm lint
pnpm format:check
pnpm skills:check
pnpm docs:check-links
```

Then run the focused suites for every fork area the merge touched, as described in
[Testing And CI](../guides/testing-and-ci.md). A `brand:check` failure after a merge means upstream
added product-name copy: rename it with the Naming table, or, when it is a value from the list above,
add an exact identifier with a reason to the allowlist.

Record the merge at the top of the [merge log](./upstream-merge-log.md). When a merge teaches a new
rule (a new conflict shape, naming case or non-branding value), add it here.
