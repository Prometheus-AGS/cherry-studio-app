# Cherry Studio Mobile - Project Overview

## Project Description

Cherry Studio is a React Native/Expo AI chat application that enables users to interact with multiple LLM providers (OpenAI, Anthropic, Google, etc.) through a unified interface. This is the mobile version of the desktop application.

## Technology Stack

### Core Framework
- **React Native** with **Expo SDK**
- **TypeScript** for type safety
- **React Navigation v7** for navigation

### Data Layer
- **SQLite** with **Drizzle ORM** for local database
- **Redux Toolkit** for state management with AsyncStorage persistence
- **MMKV** for high-performance key-value storage (sensitive data)

### UI Components
- **HeroUI** component library
- **UniwindCSS** for styling utilities
- **Consistent design tokens** across components

### AI Integration
- **Multiple LLM providers** via abstraction layer in `src/aiCore/`
- **Server-Sent Events (SSE)** for streaming responses
- **Middleware pattern** for request/response processing

## Project Structure

```
cherry-studio-app/
├── src/
│   ├── aiCore/           # AI provider abstraction layer
│   ├── components/       # Reusable UI components
│   ├── componentsV2/     # Updated component versions
│   ├── screens/          # Screen components
│   ├── services/         # Business logic layer
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── config/           # App configuration
│   ├── i18n/             # Internationalization (5 languages)
│   └── utils/            # Helper functions
├── db/
│   └── schema/           # Drizzle ORM schemas
├── drizzle/              # Database migrations
└── docs/                 # Documentation
```

## Key Development Commands

### Setup & Running
- `yarn start` - Start Expo dev server
- `yarn ios` - Run on iOS simulator/device
- `yarn android` - Run on Android emulator/device
- `yarn prebuild` - Generate native code (required before first native run)

### Database
- `npx drizzle-kit generate` - Generate migrations (REQUIRED after schema changes)
- `npx drizzle-kit studio` - Open database inspector

### Code Quality
- `yarn lint` - ESLint with auto-fix
- `yarn format` - Prettier + ESLint formatting
- `yarn test` - Jest tests with watch mode
- `yarn check:i18n` - Validate translations
- `yarn sync:i18n` - Sync translation keys

## Critical Requirements

### Database Changes
⚠️ **ALWAYS** run `npx drizzle-kit generate` after modifying any schema files in `db/schema/`

### React Compiler
This project uses **React Compiler** for automatic optimization:
- **Avoid** manual `useCallback`/`useMemo` unless expressing specific intent
- Compiler handles optimizations automatically

### Data Operations
⚠️ **ALWAYS** consult `docs/data.md` (or `docs/data-zh.md`) when working with:
- Redux state slices
- SQLite database operations
- Data flow patterns
- Entity relationships

### Internationalization
- 5 languages supported: English, Chinese (Simplified), Chinese (Traditional), Japanese, Russian
- Use `t('key')` from `react-i18next`
- **NEVER** hardcode user-facing strings
- Run `yarn check:i18n` to validate

### Logging
Use `LoggerService` with context:
```typescript
import { loggerService } from '@/services/LoggerService'
const logger = loggerService.withContext('ModuleName')

logger.info('message', context)
logger.error('message', error, context)
```

## Architecture Principles

### Clean Architecture
- **Service Layer** handles business logic (not components)
- **Provider Pattern** abstracts AI services
- **Type Safety** throughout via TypeScript
- **Separation of Concerns** between UI, business logic, and data

### State Management
- **Redux slices** for specific domains (app, assistant, topic, settings)
- Most slices **persist** to AsyncStorage (except `runtime`)
- Use `createAsyncThunk` for async operations

### Navigation
- Stack-based navigation
- Flow: WelcomeScreen → HomeScreen with nested navigators
- Settings and Assistant Market as nested navigators

## File Organization Conventions

### Component Files
- UI components: `src/components/`
- Screen components: `src/screens/`
- Feature components: `src/componentsV2/features/`

### Type Definitions
- Domain-specific files in `src/types/`
- Co-located with implementation when possible

### Database
- Schemas: `db/schema/*.ts`
- Migrations: `drizzle/*.sql`
- Metro bundler supports `.sql` file imports

### Configuration
- Models: `src/config/models/`
- Providers: `src/config/providers.ts`
- Constants: `src/constants/`

## Testing Strategy
- Jest with Expo preset
- Tests adjacent to source files with `.test.ts` suffix
- Run `yarn test` for watch mode

## Performance Considerations
- MMKV for high-performance key-value storage
- Redux persistence via AsyncStorage
- React Compiler automatic optimizations
- Lazy loading where appropriate

## Security Notes
- Sensitive data (API keys) stored in MMKV
- Provider credentials never hardcoded
- User data encrypted at rest

## Cross-Platform Considerations
- **iOS**: Requires `yarn prebuild` before first run
- **Android**: Requires `yarn prebuild` before first run
- Both platforms share same codebase
- Platform-specific code isolated when necessary