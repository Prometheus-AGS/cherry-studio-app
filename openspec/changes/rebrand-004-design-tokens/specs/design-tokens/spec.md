## ADDED Requirements

### Requirement: Brand v2.2 color system
Design tokens SHALL implement the Brand Guide v2.2 palette: ember primary per theme, cool neutral surfaces (background, card, popover, sidebar), status colors and a 10px base radius.

#### Scenario: Primary in light theme
- **WHEN** the light theme is active
- **THEN** primary equals the desktop `--cs-brand-500` value

#### Scenario: Primary in dark theme
- **WHEN** the dark theme is active
- **THEN** primary equals the desktop `--cs-brand-400` value

### Requirement: Accessible contrast
Token pairs for text and interactive elements SHALL meet WCAG 2.2 AA in both themes.

#### Scenario: Contrast check
- **WHEN** `pnpm design:check` runs
- **THEN** it fails if any foreground/surface pair is below 4.5:1 or any UI pair below 3:1
