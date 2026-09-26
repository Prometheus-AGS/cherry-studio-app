## ADDED Requirements

### Requirement: Branding regression check
`pnpm brand:check` SHALL fail when "Cherry" appears in locale values, native string resources, app.json usage strings, config plugins or source literals outside `scripts/brand-allowlist.json`, and SHALL run in PR CI.

#### Scenario: Seeded regression
- **WHEN** a locale value or `.xcstrings` entry contains "Cherry Studio"
- **THEN** `pnpm brand:check` exits non-zero

#### Scenario: Clean main
- **WHEN** `pnpm brand:check` runs on main after the phase
- **THEN** it passes
