# Quick Reference Guide

## Essential Commands

### First-Time Setup
```bash
# 1. Install dependencies
yarn install

# 2. Generate database migrations (REQUIRED)
npx drizzle-kit generate

# 3. Generate native code
yarn prebuild

# 4. Run on device/simulator
yarn ios        # iOS
yarn android    # Android
```

### Daily Development
```bash
yarn start      # Start Expo dev server
yarn ios        # Run iOS
yarn android    # Run Android
```

### After Schema Changes
```bash
# ALWAYS run this after modifying db/schema/*.ts
npx drizzle-kit generate
```

### Code Quality
```bash
yarn lint       # ESLint with auto-fix
yarn format     # Prettier + ESLint
yarn test       # Jest tests
yarn check:i18n # Validate translations
```

### Database
```bash
npx drizzle-kit studio    # Open database inspector
npx drizzle-kit generate  # Generate migrations
```

## File Locations

### Key Directories
```
src/
├── aiCore/          # AI provider abstraction
├── services/        # Business logic layer
├── components/      # Reusable UI components
├── screens/         # Screen components
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
├── config/          # Configuration
└── i18n/locales/    # Translation files (5 languages)

db/schema/           # Database schemas (run generate after changes)
drizzle/             # Generated migrations
docs/                # Project documentation
```

### Important Files
- `CLAUDE.md` - Comprehensive development guide
- `AGENTS.md` - AI assistant rules
- `docs/data.md` - Database schema documentation
- `.roo/rules/` - General coding rules
- `.roo/rules-code/` - Code-specific rules
- `.roomodes` - Roo Code mode configurations

## Quick Patterns

### TypeScript Function
```typescript
// Always explicit return types
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Async with Result pattern
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) return { success: false, error: 'Not found' }
    return { success: true, data: user }
  } catch (error) {
    logger.error('fetchUser failed', error as Error, { id })
    return { success: false, error: 'Database error' }
  }
}
```

### React Component
```typescript
interface MessageItemProps {
  message: Message
  onPress: (id: string) => void
}

export function MessageItem({ message, onPress }: MessageItemProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  
  return (
    <View className="bg-white p-4 rounded-lg shadow-md">
      <Text className="text-lg font-semibold">{message.content}</Text>
    </View>
  )
}
```

### Custom Hook
```typescript
interface UseMessagesResult {
  messages: Message[]
  loading: boolean
  error: Error | null
}

export function useMessages(topicId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    loadMessages(topicId)
  }, [topicId])
  
  return { messages, loading, error }
}
```

### Database Query
```typescript
// Use database access layer
import { messageDatabase } from '@database'

const messages = await messageDatabase.getMessagesByTopicId(topicId)

// NOT direct queries (unless in database layer)
```

### Navigation
```typescript
// Define types
type RootStackParamList = {
  Home: undefined
  Chat: { topicId: string }
}

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>

// Use in component
export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { topicId } = route.params // Typed!
  
  navigation.navigate('Home')
}
```

### Internationalization
```typescript
// NEVER hardcode strings
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return <Text>{t('settings.profile.title')}</Text>
}

// Translation keys in src/i18n/locales/*.json
```

### Logging
```typescript
import { loggerService } from '@/services/LoggerService'
const logger = loggerService.withContext('ModuleName')

logger.info('User logged in', { userId: user.id })
logger.error('Failed to save', error, { context })
```

### Redux
```typescript
// Typed hooks
import { useAppDispatch, useAppSelector } from '@/hooks/redux'

const messages = useAppSelector((state) => state.topic.messages)
const dispatch = useAppDispatch()

// Async thunk
export const fetchMessages = createAsyncThunk<
  Message[],           // Return type
  string,              // Argument type
  { rejectValue: string }
>('topic/fetchMessages', async (topicId, { rejectWithValue }) => {
  try {
    return await messageDatabase.getMessagesByTopicId(topicId)
  } catch (error) {
    return rejectWithValue('Failed to fetch')
  }
})
```

## Common Gotchas

### ❌ Forgetting Database Migrations
```bash
# After modifying db/schema/*.ts
npx drizzle-kit generate  # REQUIRED!
```

### ❌ Hardcoding Strings
```typescript
// WRONG
<Text>Profile Settings</Text>

// CORRECT
<Text>{t('settings.profile.title')}</Text>
```

### ❌ Missing Return Types
```typescript
// WRONG
export function calculate(x: number) {
  return x * 2
}

// CORRECT
export function calculate(x: number): number {
  return x * 2
}
```

### ❌ Inline Styles
```typescript
// WRONG
<View style={{ padding: 16, backgroundColor: 'white' }}>

// CORRECT
<View className="p-4 bg-white">
```

### ❌ Untyped Props
```typescript
// WRONG
export function MyComponent({ data, onPress }) {

// CORRECT
interface MyComponentProps {
  data: Data
  onPress: () => void
}
export function MyComponent({ data, onPress }: MyComponentProps) {
```

### ❌ Class Components
```typescript
// WRONG
export class MyComponent extends React.Component {

// CORRECT
export function MyComponent() {
```

## Verification Before Commit

Quick checklist:
- [ ] Run `npx drizzle-kit generate` if schema changed
- [ ] Run `yarn lint` (ESLint passes)
- [ ] Run `yarn format` (formatted)
- [ ] Run `yarn check:i18n` (no missing translations)
- [ ] All functions have return types
- [ ] No `any` types without justification
- [ ] No hardcoded user-facing strings
- [ ] Component props are typed
- [ ] Using `className` not inline styles

## Getting Help

1. **CLAUDE.md** - Comprehensive development guidelines
2. **docs/data.md** - Database schema and Redux documentation
3. **AGENTS.md** - AI assistant rules and patterns
4. **.roo/rules/** - Detailed coding standards
5. **Existing code** - Follow established patterns

## Mode Selection (Roo Code)

- **💻 Code Mode** - General development
- **🗄️ Database Specialist** - Schema/migration work
- **📝 Documentation Writer** - Docs only
- **🧪 Test Engineer** - Writing tests
- **🛡️ Security Auditor** - Security review
- **🌐 i18n Manager** - Translation work

Switch modes via Roo Code dropdown based on task type.