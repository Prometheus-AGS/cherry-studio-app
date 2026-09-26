## ADDED Requirements

### Requirement: Brand type roles
The app SHALL use Space Grotesk for display, Inter for UI, Roboto for body and JetBrains Mono for monospace and eyebrow text, bundled with their licenses, while keeping the mobile type-size scale.

#### Scenario: Heading font
- **WHEN** a heading primitive renders
- **THEN** it uses the display font

#### Scenario: Accessibility scaling
- **WHEN** the user increases text size
- **THEN** text scales through the existing mobile steps
