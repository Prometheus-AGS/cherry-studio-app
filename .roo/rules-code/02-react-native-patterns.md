# React Native & Expo Patterns

## Component Structure

### Functional Components (Required)

Always use functional components with hooks:

```typescript
// ✅ CORRECT
interface MessageItemProps {
  message: Message
  onPress: (id: string) => void
}

export function MessageItem({ message, onPress }: MessageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <View>
      <Text>{message.content}</Text>
    </View>
  )
}

// ❌ WRONG - Class components
export class MessageItem extends React.Component<MessageItemProps> {
  render() {
    return <View><Text>{this.props.message.content}</Text></View>
  }
}
```

### Component File Organization

```typescript
// ✅ CORRECT - Top to bottom order
import statements
type definitions
constants
helper functions
main component
sub-components (if any)
styles (if using StyleSheet)
export

// Example:
import { View, Text, Pressable } from 'react-native'
import type { Message } from '@/types'

const MAX_CONTENT_LENGTH = 500

function truncateContent(content: string): string {
  return content.length > MAX_CONTENT_LENGTH 
    ? content.slice(0, MAX_CONTENT_LENGTH) + '...'
    : content
}

export function MessageItem({ message, onPress }: MessageItemProps) {
  // Component implementation
}
```

## React Hooks Best Practices

### useState

```typescript
// ✅ CORRECT - Typed state
const [count, setCount] = useState<number>(0)
const [user, setUser] = useState<User | null>(null)
const [items, setItems] = useState<Item[]>([])

// ✅ CORRECT - Functional updates for derived state
setCount(prevCount => prevCount + 1)
setItems(prevItems => [...prevItems, newItem])

// ❌ WRONG - Untyped state
const [count, setCount] = useState(0)
const [user, setUser] = useState(null)
```

### useEffect

```typescript
// ✅ CORRECT - Proper cleanup
useEffect(() => {
  const subscription = eventEmitter.subscribe('message', handleMessage)
  
  return () => {
    subscription.unsubscribe()
  }
}, [handleMessage])

// ✅ CORRECT - Dependencies listed
useEffect(() => {
  loadData(topicId)
}, [topicId])

// ❌ WRONG - Missing dependencies
useEffect(() => {
  loadData(topicId)
}, []) // Should include topicId

// ❌ WRONG - No cleanup for subscription
useEffect(() => {
  const subscription = eventEmitter.subscribe('message', handleMessage)
}, [])
```

### React Compiler Considerations

This project uses React Compiler for automatic optimization:

```typescript
// ✅ CORRECT - Let compiler handle optimization
function MyComponent({ items }: Props) {
  const filteredItems = items.filter(item => item.active)
  
  return (
    <FlatList
      data={filteredItems}
      renderItem={renderItem}
    />
  )
}

// ⚠️ AVOID - Only use when expressing specific intent
function MyComponent({ items }: Props) {
  const filteredItems = useMemo(
    () => items.filter(item => item.active),
    [items]
  )
  
  const renderItem = useCallback((item) => {
    return <ItemView item={item} />
  }, [])
  
  return <FlatList data={filteredItems} renderItem={renderItem} />
}
```

**Note**: Only use `useMemo`/`useCallback` when you have a specific reason to prevent re-execution, not for general performance optimization.

## Custom Hooks

### Hook Naming and Structure

```typescript
// ✅ CORRECT - Clear return type and naming
interface UseMessagesResult {
  messages: Message[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useMessages(topicId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  
  const loadMessages = async () => {
    setLoading(true)
    try {
      const data = await messageDatabase.getMessagesByTopicId(topicId)
      setMessages(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadMessages()
  }, [topicId])
  
  return { messages, loading, error, refresh: loadMessages }
}

// ❌ WRONG - Unclear return structure
export function useMessages(topicId: string) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  // ... returns unclear structure
  return [messages, loading, loadMessages]
}
```

## Performance Patterns

### FlatList Optimization

```typescript
// ✅ CORRECT - Optimized FlatList
interface MessageListProps {
  messages: Message[]
  onMessagePress: (id: string) => void
}

const keyExtractor = (item: Message) => item.id

const renderItem = ({ item }: { item: Message }) => (
  <MessageItem message={item} onPress={onMessagePress} />
)

export function MessageList({ messages, onMessagePress }: MessageListProps) {
  return (
    <FlatList
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      windowSize={10}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={true}
      initialNumToRender={10}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
    />
  )
}

// ❌ WRONG - Inline functions recreated on every render
export function MessageList({ messages, onMessagePress }: MessageListProps) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageItem message={item} onPress={onMessagePress} />}
    />
  )
}
```

### Conditional Rendering

```typescript
// ✅ CORRECT - Early returns for cleaner code
export function MessageScreen({ topicId }: Props) {
  const { messages, loading, error } = useMessages(topicId)
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (error) {
    return <ErrorView error={error} />
  }
  
  if (messages.length === 0) {
    return <EmptyState />
  }
  
  return <MessageList messages={messages} />
}

// ❌ WRONG - Nested ternaries
export function MessageScreen({ topicId }: Props) {
  const { messages, loading, error } = useMessages(topicId)
  
  return loading ? (
    <LoadingSpinner />
  ) : error ? (
    <ErrorView error={error} />
  ) : messages.length === 0 ? (
    <EmptyState />
  ) : (
    <MessageList messages={messages} />
  )
}
```

## Styling with UniwindCSS

### Tailwind-like Utilities

```typescript
// ✅ CORRECT - Using className with UniwindCSS
import { View, Text } from 'react-native'

export function Card({ children }: Props) {
  return (
    <View className="bg-white rounded-lg p-4 shadow-md">
      <Text className="text-lg font-bold text-gray-900">
        {children}
      </Text>
    </View>
  )
}

// ✅ CORRECT - Conditional classes
export function Button({ variant, children }: Props) {
  return (
    <Pressable 
      className={`px-4 py-2 rounded ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}`}
    >
      <Text className="text-white font-semibold">{children}</Text>
    </Pressable>
  )
}

// ❌ WRONG - Inline styles (avoid unless absolutely necessary)
export function Card({ children }: Props) {
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        {children}
      </Text>
    </View>
  )
}
```

## Platform-Specific Code

### Platform Detection

```typescript
import { Platform } from 'react-native'

// ✅ CORRECT - Platform-specific values
const PADDING = Platform.select({
  ios: 20,
  android: 16,
  default: 16,
})

// ✅ CORRECT - Platform-specific components
export function Header() {
  return (
    <View>
      {Platform.OS === 'ios' && <IOSStatusBar />}
      {Platform.OS === 'android' && <AndroidToolbar />}
    </View>
  )
}

// ✅ CORRECT - Platform-specific imports
import {
  SafeAreaView as IOSSafeAreaView,
} from 'react-native-safe-area-context'

const SafeAreaView = Platform.OS === 'ios' ? IOSSafeAreaView : View
```

## Navigation Patterns

### Type-Safe Navigation

```typescript
// ✅ CORRECT - Define navigation types
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Home: undefined
  Chat: { topicId: string; assistantId?: string }
  Settings: { section?: 'profile' | 'preferences' | 'about' }
}

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>

export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { topicId, assistantId } = route.params
  
  const navigateToSettings = () => {
    navigation.navigate('Settings', { section: 'preferences' })
  }
  
  return <View>{/* Implementation */}</View>
}
```

### Navigation Best Practices

```typescript
// ✅ CORRECT - Use navigation methods appropriately
navigation.navigate('Chat', { topicId: '123' }) // Navigate or update existing
navigation.push('Chat', { topicId: '123' }) // Always push new screen
navigation.replace('Home') // Replace current screen
navigation.goBack() // Go back one screen
navigation.popToTop() // Go to first screen in stack

// ✅ CORRECT - Listen to navigation events
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Screen is focused - refresh data
    refreshData()
  })
  
  return unsubscribe
}, [navigation])

// ❌ WRONG - Navigation in render
export function Screen({ navigation }: Props) {
  if (someCondition) {
    navigation.navigate('Home') // Don't navigate during render!
  }
  return <View />
}
```

## Accessibility

### Accessible Components

```typescript
// ✅ CORRECT - Proper accessibility props
export function MessageItem({ message, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(message.id)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Message from ${message.author}`}
      accessibilityHint="Double tap to open message details"
    >
      <Text>{message.content}</Text>
    </Pressable>
  )
}

// ✅ CORRECT - Dynamic accessibility
export function ToggleButton({ isEnabled, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: isEnabled }}
      accessibilityLabel={isEnabled ? 'Enabled' : 'Disabled'}
    >
      <Text>{isEnabled ? 'ON' : 'OFF'}</Text>
    </Pressable>
  )
}
```

## Error Boundaries

```typescript
// ✅ CORRECT - Error boundary for crash protection
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

## Verification Checklist

Before committing React Native code:

- [ ] All components are functional (not class-based)
- [ ] Component props have TypeScript interfaces
- [ ] Hooks have proper dependencies in dependency arrays
- [ ] FlatList components use keyExtractor and optimized renderItem
- [ ] No inline style objects (use UniwindCSS className)
- [ ] Platform-specific code properly isolated
- [ ] Navigation is type-safe with proper param types
- [ ] Accessibility props added to interactive elements
- [ ] No navigation calls during render
- [ ] Cleanup functions return from useEffect when needed
- [ ] Let React Compiler handle optimization (avoid manual useMemo/useCallback unless needed)