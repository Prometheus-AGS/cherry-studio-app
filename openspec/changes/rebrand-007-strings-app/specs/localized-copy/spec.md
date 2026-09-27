## ADDED Requirements

### Requirement: Product name in every locale
User-visible copy SHALL name the product The Boss in all 13 app locales and painting-template locales, changing values only and keeping translation keys.

#### Scenario: Chat placeholder
- **WHEN** the chat input is empty in any supported locale
- **THEN** the placeholder names The Boss

#### Scenario: Default agent
- **WHEN** a new install creates its default agent
- **THEN** it is named Boss Agent (localized)
