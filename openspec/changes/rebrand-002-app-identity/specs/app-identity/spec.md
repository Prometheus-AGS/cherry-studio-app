## ADDED Requirements

### Requirement: The Boss application identity
The app SHALL present itself as "The Boss" with iOS bundle identifier `tools.know-me.the-boss` and the Android package decided in PD-2, including derived widget, share-extension and app-group identifiers and the development and preview suffixes.

#### Scenario: Production profile
- **WHEN** the production Expo config is resolved
- **THEN** name is "The Boss" and the iOS bundle identifier is `tools.know-me.the-boss`

#### Scenario: Side-by-side install
- **WHEN** a development build is installed on a device that has Cherry Studio
- **THEN** both apps are installed as separate apps

### Requirement: Localized permission prompts
Every permission and usage description SHALL name The Boss and SHALL be provided in all 13 app locales.

#### Scenario: Permission prompt
- **WHEN** the OS shows a permission prompt in a supported locale
- **THEN** the text names The Boss in that language
