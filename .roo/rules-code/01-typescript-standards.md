# TypeScript Standards

## Type Safety Requirements

### Explicit Return Types (REQUIRED)

All functions must have explicit return types:

```typescript
// ✅ CORRECT
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

export async function fetchUser(id: string): Promise<User | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  return user
}

// ❌ WRONG - Missing return type
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### Avoid `any` Type

Never use `any` unless absolutely necessary with justification:

```typescript
// ✅ CORRECT - Use unknown + type guards
function processData(data: unknown): void {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // Type narrowed safely
    console.log(data.id)
  }
}

// ✅ CORRECT - Use specific types
function handleError(error: Error): string {
  return error.message
}

// ❌ WRONG - Never use any without justification
function processData(data: any) {
  return data.property // No type safety
}
```

### Strict Null Checks

Always handle null/undefined explicitly:

```typescript
// ✅ CORRECT
function getUserName(user: User | null): string {
  if (!user) {
    return 'Anonymous'
  }
  return user.name
}

// ✅ CORRECT - Using optional chaining
function getEmail(user?: User): string | undefined {
  return user?.email
}

// ❌ WRONG - Assuming value exists
function getUserName(user: User | null): string {
  return user.name // Type error: user might be null
}
```

## React Native Specific Types

### Component Props

Always define props interfaces:

```typescript
// ✅ CORRECT
interface MessageItemProps {
  message: Message
  onPress?: (id: string) => void
  highlighted?: boolean
}

export function MessageItem({ message, onPress, highlighted = false }: MessageItemProps) {
  // Implementation
}

// ❌ WRONG - No prop types
export function MessageItem({ message, onPress, highlighted }) {
  // Implementation
}
```

### Hooks with Types

```typescript
// ✅ CORRECT
const [messages, setMessages] = useState<Message[]>([])
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<Error | null>(null)

// ✅ CORRECT - Custom hook with return type
function useMessages(): { messages: Message[]; loading: boolean; error: Error | null } {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  
  return { messages, loading, error }
}

// ❌ WRONG - No type parameters
const [messages, setMessages] = useState([])
```

### Navigation Types

Use proper navigation types from React Navigation:

```typescript
// ✅ CORRECT
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Home: undefined
  Chat: { topicId: string }
  Settings: { section?: string }
}

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>

export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { topicId } = route.params // Typed!
}

// ❌ WRONG - Untyped navigation
export function ChatScreen({ route, navigation }: any) {
  const { topicId } = route.params
}
```

## Async/Await Patterns

### Always Use Async/Await

Prefer async/await over promise chains:

```typescript
// ✅ CORRECT
async function loadUserData(userId: string): Promise<User> {
  const user = await userService.getUser(userId)
  const profile = await profileService.getProfile(user.profileId)
  return { ...user, profile }
}

// ❌ WRONG - Promise chains
function loadUserData(userId: string): Promise<User> {
  return userService.getUser(userId)
    .then(user => profileService.getProfile(user.profileId))
    .then(profile => ({ ...user, profile }))
}
```

### Error Handling with Result Pattern

Use Result type for error handling:

```typescript
// ✅ CORRECT
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    return { success: true, data: user }
  } catch (error) {
    logger.error('fetchUser failed', error as Error, { id })
    return { success: false, error: 'Database error' }
  }
}

// Usage
const result = await fetchUser('123')
if (result.success) {
  console.log(result.data.name) // Type-safe access
} else {
  console.error(result.error)
}

// ❌ WRONG - Throwing errors for flow control
async function fetchUser(id: string): Promise<User> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) {
    throw new Error('User not found') // Forces try/catch everywhere
  }
  return user
}
```

## Type Assertions

### Avoid Type Assertions When Possible

```typescript
// ✅ CORRECT - Use type guards
function isMessage(obj: unknown): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj
  )
}

if (isMessage(data)) {
  console.log(data.content) // Type-safe
}

// ❌ WRONG - Unsafe type assertion
const message = data as Message
console.log(message.content) // No runtime safety
```

## Redux Toolkit Types

### Typed Hooks

```typescript
// ✅ CORRECT - Typed hooks
import type { RootState, AppDispatch } from '@/store'
import { useDispatch, useSelector } from 'react-redux'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) => 
  useSelector(selector)

// Usage
const messages = useAppSelector((state) => state.topic.messages)
const dispatch = useAppDispatch()
```

### Async Thunks

```typescript
// ✅ CORRECT
import { createAsyncThunk } from '@reduxjs/toolkit'

export const fetchTopicMessages = createAsyncThunk<
  Message[],           // Return type
  string,              // Argument type
  { rejectValue: string } // Rejection type
>(
  'topic/fetchMessages',
  async (topicId: string, { rejectWithValue }) => {
    try {
      const messages = await messageDatabase.getMessagesByTopicId(topicId)
      return messages
    } catch (error) {
      return rejectWithValue('Failed to fetch messages')
    }
  }
)
```

## Service Layer Types

### Service Method Signatures

```typescript
// ✅ CORRECT - Clear service interface
export class TopicService {
  async createTopic(assistantId: string, name: string): Promise<Topic> {
    // Implementation
  }
  
  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<void> {
    // Implementation
  }
  
  async deleteTopic(topicId: string): Promise<void> {
    // Implementation
  }
  
  async getTopic(topicId: string): Promise<Topic | null> {
    // Implementation
  }
}

// ❌ WRONG - Unclear return types
export class TopicService {
  async createTopic(assistantId, name) {
    // Implementation
  }
}
```

## Type Imports

### Use Type Imports

```typescript
// ✅ CORRECT - Type-only imports
import type { User, Message, Topic } from '@/types'
import type { NavigationProp } from '@react-navigation/native'

// ✅ CORRECT - Mixed imports
import { useState } from 'react'
import type { ReactNode } from 'react'

// ❌ WRONG - Value imports for types
import { User, Message } from '@/types' // These are types, use 'type' keyword
```

## Utility Types

### Use Built-in Utility Types

```typescript
// ✅ CORRECT
type PartialUser = Partial<User>
type RequiredUser = Required<User>
type UserWithoutPassword = Omit<User, 'password'>
type UserCredentials = Pick<User, 'email' | 'password'>

// ✅ CORRECT - Record types
type ModelMap = Record<string, Model>
type ErrorMessages = Record<string, string>

// ✅ CORRECT - Readonly
type ImmutableConfig = Readonly<Config>
```

## Verification Checklist

Before committing TypeScript code:

- [ ] All functions have explicit return types
- [ ] No `any` types without justification comments
- [ ] Null/undefined handled explicitly
- [ ] Proper error handling with Result pattern or try/catch
- [ ] Component props have interface definitions
- [ ] Redux hooks are typed
- [ ] Navigation types are defined
- [ ] Type imports use `import type` syntax
- [ ] No unsafe type assertions
- [ ] Async operations use async/await