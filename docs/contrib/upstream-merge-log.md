# Upstream Merge Log

What each merge from `CherryHQ/cherry-studio-app`, and each desktop port from `CherryHQ/cherry-studio`,
actually hit. Rules belong in [the playbook](./upstream-merges.md) and owners in
[Fork Surface](./fork-surface.md); this page is history and carry-over. Newest entry first.

## Open Items

Branding or merge work known to be outstanding. Close an item by moving it into the entry of the merge
or change that fixed it.

## Entry Template

```markdown
## YYYY-MM-DD — upstream <short sha> (merge/upstream-YYYY-MM-DD, <merge commit>)

- **Taken:** N upstream commits, <base>..<upstream sha>
- **Conflicts:** <file> — <owner> — <resolution>
- **Regenerated:** <generated files rebuilt instead of hand-merged>
- **Patches:** <patched dependencies upstream bumped, and what happened to each patch>
- **Rebranded:** <upstream copy renamed with the Naming table>
- **Left as upstream:** <accepted leftovers and allowlist entries added, and why>
- **Gate:** pnpm install --frozen-lockfile, i18n:check, brand:check, typecheck, lint, format:check, skills:check, <focused suites>
```

No merges recorded yet.
