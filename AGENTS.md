# Cherry Studio Mobile - AI Agent Rules

## Project Identity

**Name**: Cherry Studio Mobile  
**Type**: React Native/Expo AI Chat Application  
**Tech Stack**: TypeScript, React Native, Expo, SQLite, Drizzle ORM, Redux Toolkit  
**Purpose**: Multi-LLM provider chat interface for mobile devices

## Critical Commands

### Before First Run
```bash
npx drizzle-kit generate  # Generate database migrations (REQUIRED)
yarn prebuild             # Generate native code for iOS/Android
```

### Development
```bash
yarn start      # Start Expo dev server
yarn ios        # Run on iOS simulator/device
yarn android    # Run on Android emulator/device
```

### Database
```bash
npx drizzle-kit generate  # After ANY schema change in db/schema/
npx drizzle-kit studio    # Database inspector
```

### Code Quality
```bash
yarn lint        # ESLint with auto-fix
yarn format      # Prettier + ESLint formatting
yarn test        # Jest tests
yarn check:i18n  # Validate translations (5 languages)
```

## Core Principles

### 1. Database Operations
⚠️ **ALWAYS** run `npx drizzle-kit generate` after modifying schemas in `db/schema/`  
⚠️ **ALWAYS** consult `docs/data.md` before working with database or Redux state

### 2. Type Safety
- Explicit return types on ALL functions
- NO `any` types without justification comment
- Null/undefined handled explicitly
- Proper TypeScript interfaces for all component props

### 3. React Native Patterns
- Functional components ONLY (no class components)
- Use React Compiler optimization (avoid manual `useMemo`/`useCallback` unless expressing intent)
- Type-safe navigation with proper param lists
- UniwindCSS `className` for styling (avoid inline styles)

### 4. Internationalization
- NEVER hardcode user-facing strings
- Use `t('key')` from `react-i18next`
- Run `yarn check:i18n` to validate
- 5 languages supported: en-us, zh-cn, zh-tw, ja-jp, ru-ru

### 5. Error Handling
```typescript
// Use Result pattern
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Use LoggerService with context
import { loggerService } from '@/services/LoggerService'
const logger = loggerService.withContext('ModuleName')
logger.error('message', error, context)
```

## Architecture

### Directory Structure
```
src/
├── aiCore/         # AI provider abstraction (OpenAI, Anthropic, etc.)
├── services/       # Business logic (NOT in components)
├── components/     # Reusable UI components
├── componentsV2/   # Updated component versions
├── screens/        # Screen components
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── config/         # App configuration
└── i18n/           # Internationalization files

db/
└── schema/         # Drizzle ORM schemas (run generate after changes)

drizzle/            # Generated migrations (auto-created)
```

### Service Layer Pattern
Business logic lives in services (e.g., `TopicService`, `AssistantService`), NOT in React components.

### State Management
- Redux Toolkit slices: `app`, `assistant`, `topic`, `settings`, `runtime`
- Most slices persist to AsyncStorage (except `runtime`)
- Use `createAsyncThunk` for async operations

## Code Standards

### TypeScript
```typescript
// ✅ CORRECT
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ WRONG - Missing return type
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### Components
```typescript
// ✅ CORRECT
interface MessageItemProps {
  message: Message
  onPress: (id: string) => void
}

export function MessageItem({ message, onPress }: MessageItemProps) {
  return (
    <View className="bg-white p-4 rounded-lg">
      <Text className="text-lg">{message.content}</Text>
    </View>
  )
}

// ❌ WRONG - No prop types, inline styles
export function MessageItem({ message, onPress }) {
  return (
    <View style={{ backgroundColor: 'white', padding: 16 }}>
      <Text>{message.content}</Text>
    </View>
  )
}
```

### Database
```typescript
// ✅ CORRECT - Use database access layer
import { topicDatabase } from '@database'
const topic = await topicDatabase.getTopicById(topicId)

// ❌ WRONG - Direct queries outside database layer
import { db } from '@db'
const topic = await db.query.topics.findFirst(...)
```

### Hooks
```typescript
// ✅ CORRECT - Typed hooks with proper dependencies
function useMessages(topicId: string): { messages: Message[]; loading: boolean } {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  
  useEffect(() => {
    loadMessages(topicId)
  }, [topicId]) // Dependencies listed
  
  return { messages, loading }
}
```

## Performance

### FlatList Optimization
```typescript
// ✅ CORRECT
const keyExtractor = (item: Message) => item.id
const renderItem = ({ item }: { item: Message }) => <MessageItem message={item} />

<FlatList
  data={messages}
  keyExtractor={keyExtractor}
  renderItem={renderItem}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
/>
```

### React Compiler
Let the compiler optimize - avoid manual `useMemo`/`useCallback` unless expressing specific intent.

## Security

- Sensitive data (API keys) stored in MMKV (encrypted)
- Provider credentials NEVER hardcoded
- Input validation for all user inputs
- Parameterized queries (Drizzle ORM handles this)

## Testing

```bash
yarn test              # Run tests with watch mode
yarn test --coverage   # Generate coverage report
```

- Jest with Expo preset
- Test files adjacent to source: `*.test.ts`
- AAA pattern (Arrange, Act, Assert)
- 80% coverage target for services

## Common Mistakes to Avoid

❌ Modifying database schema without running `npx drizzle-kit generate`  
❌ Hardcoding user-facing strings instead of using `t('key')`  
❌ Using `any` type without justification  
❌ Inline styles instead of UniwindCSS className  
❌ Class components instead of functional components  
❌ Navigation during render  
❌ Direct database queries outside database access layer  
❌ Missing return types on functions  
❌ Untyped component props  
❌ Missing useEffect dependencies

## Verification Checklist

Before committing:

- [ ] TypeScript: Explicit return types, no `any` without justification
- [ ] Database: Ran `npx drizzle-kit generate` after schema changes
- [ ] i18n: No hardcoded strings, translations validated
- [ ] Components: Props typed, using className not inline styles
- [ ] Hooks: Proper dependencies in useEffect arrays
- [ ] Navigation: Type-safe with param lists
- [ ] Tests: Added/updated tests for new functionality
- [ ] Logging: Used LoggerService with context
- [ ] Code quality: `yarn lint` and `yarn format` passing

## Additional Resources

- Full architecture details: See `CLAUDE.md`
- Database schema documentation: `docs/data.md` or `docs/data-zh.md`
- Code rules for Roo: See `.roo/rules/` and `.roo/rules-code/`

## For AI Assistants

When working on this project:

1. **Read CLAUDE.md first** for comprehensive development guidelines
2. **Consult docs/data.md** before any database/Redux operations
3. **Follow the patterns** in existing code - consistency is key
4. **Run required commands** - especially `npx drizzle-kit generate` after schema changes
5. **Validate i18n** with `yarn check:i18n` after adding user-facing text
6. **Use the service layer** - keep business logic out of components
7. **Type everything** - this is a TypeScript project with strict typing
8. **Test your changes** - run `yarn test` before committing