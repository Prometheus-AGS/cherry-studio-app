## ADDED Requirements

### Requirement: Brand v2.2 imagery
App icon, adaptive icon, splash, notification icon and in-app logos SHALL be generated from the Brand Guide v2.2 vector sources stored in `assets/branding/source/`.

#### Scenario: Home screen icon
- **WHEN** the app is installed
- **THEN** the home screen shows the v2.2 icon on iOS and Android

#### Scenario: Onboarding logo
- **WHEN** onboarding plays the logo animation
- **THEN** it draws The Boss mark, not the Cherry mark
