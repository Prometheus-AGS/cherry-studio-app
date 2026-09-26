## ADDED Requirements

### Requirement: Single brand identity module
The app SHALL read its product name, short name, company, application identifier, slug, brand URLs, attribution values and export watermark brand from `src/shared/branding/`, and SHALL NOT hardcode them in consumer modules.

#### Scenario: About screen uses the module
- **WHEN** the About screen renders
- **THEN** it shows the product name and links provided by `src/shared/branding/`

#### Scenario: Outbound headers use the module
- **WHEN** the app sends provider requests with default headers
- **THEN** the application name value comes from `src/shared/branding/`

### Requirement: Glossary protects the product name
The translation glossary SHALL list "The Boss" as do-not-translate and SHALL keep CherryIN and CherryAI as service names.

#### Scenario: Glossary entry
- **WHEN** `scripts/i18nGlossary.json` is read
- **THEN** `doNotTranslate` contains "The Boss" and does not contain "Cherry Studio"
