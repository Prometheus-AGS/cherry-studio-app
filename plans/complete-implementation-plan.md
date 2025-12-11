# Complete Implementation Plan: Topic Renaming + Context Management
**For: Cherry Studio Mobile App**  
**Date: 2025-12-11**

## Executive Summary

This plan implements two features in sequence:
- **Option A**: Automatic topic renaming (✅ 90% Complete)
- **Option B**: Full context management system with transparent user notifications (📋 Detailed Plan)

Both features leverage the mobile app's existing aiCore infrastructure and follow the desktop app's proven patterns.

---

## Option A: Automatic Topic Renaming (PRIORITY 1)

### Status: ✅ 90% Complete

#### ✅ Completed Components
1. **Preference schemas** - `topic.enable_naming`, `topic.naming_prompt`
2. **Runtime Redux state** - `renamingTopics`, `newlyRenamedTopics` for UI feedback
3. **API Service** - `fetchMessagesSummary()` using ModernAiProvider
4. **Auto-rename hook** - `autoRenameTopic()`, `startTopicRenaming()`, `finishTopicRenaming()`
5. **i18n translations** - `prompts.title` for default naming prompt

#### 📋 Remaining Work (2-3 hours)

##### Task 1: Integrate with Message Streaming
**File**: `src/services/messageStreaming/callbacks/baseCallbacks.ts`

Add after successful assistant response:
```typescript
import { autoRenameTopic } from '@/hooks/useTopic'

// In the success callback after message is complete:
if (chunk.type === ChunkType.LLM_RESPONSE_COMPLETE) {
  // Trigger auto-rename in background
  autoRenameTopic(assistant, topicId).catch(error => {
    logger.error('Auto-rename failed:', error)
  })
}
```

##### Task 2: UI Loading States
**Files**: 
- `src/components/TopicItem.tsx` (or wherever topics are displayed)
- Add visual indicator when `renamingTopics.includes(topicId)`

```typescript
import { useAppSelector } from '@/hooks/redux'

const renamingTopics = useAppSelector(state => state.runtime.renamingTopics)
const newlyRenamed = useAppSelector(state => state.runtime.newlyRenamedTopics)

const isRenaming = renamingTopics.includes(topic.id)
const justRenamed = newlyRenamed.includes(topic.id)

// Show loading spinner or "✨" animation
```

##### Task 3: Testing
- Test with 2+ message conversations
- Test with/without `topic.enable_naming` enabled
- Test with custom naming prompts
- Test fallback when AI fails

**Estimated completion**: 2-3 hours for a skilled developer

---

## Option B: Full Context Management System (PRIORITY 2)

### Overview

Port the desktop app's sophisticated context management system that prevents "input too large" errors through intelligent message handling and transparent user notifications.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Sends Message                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               ConversationService.prepareMessages            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Filter Pipeline (existing)                        │   │
│  │    - Remove empty/error messages                     │   │
│  │    - Filter by contextCount setting                  │   │
│  │    - Ensure user message starts                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Token Estimation                                  │   │
│  │    - Count tokens in messages + attachments          │   │
│  │    - Check against model context limit               │   │
│  │    - Determine if over budget                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Apply Context Strategy (if over budget)           │   │
│  │    ┌────────────────────────────────────────────┐    │   │
│  │    │ • Sliding Window                           │    │   │
│  │    │ • Progressive Summarization                │    │   │
│  │    │ • Hierarchical Memory                      │    │   │
│  │    │ • Truncate Middle                          │    │   │
│  │    └────────────────────────────────────────────┘    │   │
│  │    Returns: { messages, summary, tokensS saved }     │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Generate CONTEXT_ACTION Block (if applied)        │   │
│  │    - Create notification block                       │   │
│  │    - Include summary of what was done                │   │
│  │    - Add to message blocks                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Send to AI Provider (with managed context)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Display CONTEXT_ACTION Block in UI              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  ℹ️  Context Management                            │   │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│   │  Applied Sliding Window strategy:                  │   │
│   │  • Removed 8 older messages                        │   │
│   │  • Saved ~3,200 tokens                             │   │
│   │  • Kept 12 most recent messages                    │   │
│   │                                                     │   │
│   │  [Tap to see details] ▼                            │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Message Block Type (NEW)

**File**: `src/types/message.ts`

Add new block type:
```typescript
export enum MessageBlockType {
  // ... existing types ...
  CONTEXT_ACTION = 'context_action' // Context management notification
}

export interface ContextActionMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.CONTEXT_ACTION
  action: 'sliding_window' | 'summarize' | 'hierarchical' | 'truncate_middle'
  summary: string  // Human-readable description
  removedCount?: number  // Number of messages removed
  tokensSaved?: number  // Tokens saved
  metadata?: {
    strategyType: string
    originalMessageCount: number
    finalMessageCount: number
    contextSummary?: string  // For summarization strategies
    keptMessageIds?: string[]  // Which messages were kept
  }
}
```

#### 2. Transparent Notification UI

**File**: `src/components/message/ContextActionBlock.tsx` (NEW)

```typescript
interface Props {
  block: ContextActionMessageBlock
  onExpand?: () => void
}

export function ContextActionBlock({ block, onExpand }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation()
  
  return (
    <TouchableOpacity 
      onPress={() => setExpanded(!expanded)}
      className="bg-secondary/50 p-4 rounded-lg border border-border my-2"
    >
      <View className="flex-row items-start gap-3">
        <Info size={16} className="text-muted-foreground mt-0.5" />
        <View className="flex-1">
          <Text className="font-medium text-sm mb-1">
            {t('message.context_action.title')}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {block.summary}
          </Text>
          
          {expanded && block.metadata && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-muted-foreground mb-2">
                {t('message.context_action.details')}:
              </Text>
              <Text className="text-xs">
                • {t('message.context_action.strategy')}: {block.action}
              </Text>
              <Text className="text-xs">
                • {t('message.context_action.removed')}: {block.removedCount} messages
              </Text>
              <Text className="text-xs">
                • {t('message.context_action.saved')}: ~{block.tokensSaved} tokens
              </Text>
              {block.metadata.contextSummary && (
                <Text className="text-xs mt-2 italic">
                  "{block.metadata.contextSummary}"
                </Text>
              )}
            </View>
          )}
          
          <Text className="text-xs text-primary mt-2">
            {expanded ? '▲' : '▼'} {t('message.context_action.tap_details')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
```

**UX Features**:
- **Inline notification** - Appears as a message block in the conversation
- **Collapsible details** - Tap to expand/collapse
- **Clear information** - Shows what was done, how many messages, tokens saved
- **Non-intrusive** - Subtle styling, doesn't interrupt conversation flow
- **Transparent** - Shows exactly what the system did

#### 3. Research-Informed UX Design

Based on research and desktop patterns:

**Best Practices Applied**:

1. **Roo Code Pattern** - "Condensing context..." progress indicator
   - We'll show this during context processing
   
2. **GPT-5 Pattern** - Prominent display like intermediate messages
   - Context blocks appear inline in conversation
   
3. **LM Studio Pattern** - Clear strategy descriptions
   - Each strategy has human-readable explanation
   
4. **Claude Memory Pattern** - Complete transparency
   - Show "actual synthesis, not vague summaries"
   - Users can see exactly what was kept/removed

**Our Implementation Advantages**:
- ✅ **Expandable details** - Tap to see full breakdown
- ✅ **Visual hierarchy** - Icon + title + description
- ✅ **Non-blocking** - Doesn't interrupt chat flow
- ✅ **Persistent** - Saved as message block, reviewable later
- ✅ **Actionable** - Could add "Undo" or "Adjust settings" buttons

---

## Implementation Timeline

### Phase 1: Topic Renaming Integration (Week 1)
**Duration**: 2-3 hours  
**Priority**: HIGH

- ✅ Core implementation (DONE)
- [ ] Integrate with message streaming
- [ ] Add UI loading states
- [ ] Test end-to-end

**Deliverable**: Working topic auto-rename feature

---

### Phase 2: Context Management Foundation (Week 1-2)
**Duration**: 1.5 weeks  
**Priority**: HIGH

#### Week 1
- [ ] Add `CONTEXT_ACTION` message block type
- [ ] Create context strategy types (`src/types/contextStrategy.ts`)
- [ ] Port `contextLimits.ts` (model context window data)
- [ ] Create base `TokenService` with token estimation
- [ ] Database migration for context metadata fields

**Deliverable**: Type-safe foundation with token tracking

#### Week 2
- [ ] Implement `SlidingWindowStrategy` (simplest)
- [ ] Implement `TruncateMiddleStrategy` (no AI needed)
- [ ] Create `ContextActionBlock` UI component
- [ ] Basic integration with ConversationService

**Deliverable**: Two working strategies with UI notification

---

### Phase 3: Advanced Strategies (Week 3-4)
**Duration**: 2 weeks  
**Priority**: MEDIUM

#### Week 3
- [ ] Implement extractive `SummarizationStrategy` (no AI)
- [ ] Add configuration resolver (hierarchy: Topic → Assistant → Global)
- [ ] Create settings UI for strategy selection
- [ ] Add strategy preview/simulation

**Deliverable**: Three strategies, user-configurable

#### Week 4
- [ ] Implement AI-powered `SummarizationStrategy`
- [ ] Implement `HierarchicalMemoryStrategy`
- [ ] Add context metadata persistence
- [ ] Performance optimization (<100ms)

**Deliverable**: All 4 strategies fully functional

---

### Phase 4: Polish & Testing (Week 5)
**Duration**: 1 week  
**Priority**: HIGH

- [ ] Comprehensive i18n (5 languages)
- [ ] Integration tests for all strategies
- [ ] Performance benchmarks
- [ ] Error handling edge cases
- [ ] User documentation
- [ ] Migration guide

**Deliverable**: Production-ready system

---

## Detailed Component Specifications

### 1. CONTEXT_ACTION Message Block

**Purpose**: Transparently inform users when context management is applied

**Visual Design** (Mobile-optimized):
```
┌─────────────────────────────────────────────────┐
│  ℹ️  Context Management                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                 │
│  Applied Sliding Window strategy to stay       │
│  within model limits:                           │
│                                                 │
│  • Removed 8 older messages                     │
│  • Saved ~3,200 tokens                          │
│  • Kept 12 most recent messages                 │
│                                                 │
│  ▼ Tap for details                              │
└─────────────────────────────────────────────────┘

(When expanded)
┌─────────────────────────────────────────────────┐
│  ℹ️  Context Management                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                 │
│  Applied Sliding Window strategy to stay       │
│  within model limits:                           │
│                                                 │
│  • Removed 8 older messages                     │
│  • Saved ~3,200 tokens                          │
│  • Kept 12 most recent messages                 │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Details:                                       │
│  • Strategy: sliding_window                     │
│  • Model context: 128,000 tokens                │
│  • Before: 15,234 tokens (20 messages)          │
│  • After: 12,034 tokens (12 messages)           │
│  • Messages kept: #1, #13-20                    │
│                                                 │
│  ▲ Hide details                                 │
└─────────────────────────────────────────────────┘
```

**Interaction States**:
- **Collapsed** (default): Shows summary only
- **Expanded**: Shows detailed breakdown
- **Tap action**: Toggle expanded state
- **Optional**: Link to settings to adjust strategy

### 2. Token Estimation Service

**File**: `src/services/TokenService.ts` (NEW)

**Key Functions**:
```typescript
// Estimate tokens for a single message (handles all block types)
export function estimateSingleMessageTokens(message: Message): number

// Estimate tokens for message array
export function estimateMessagesTokens(messages: Message[]): number

// Estimate total conversation including system prompt
export function estimateConversationTokens(
  messages: Message[], 
  systemPrompt?: string
): number

// Calculate remaining budget
export function calculateRemainingBudget(
  model: Model,
  messages: Message[],
  systemPrompt?: string,
  maxOutputTokens?: number
): {
  modelLimit: number
  currentUsage: number
  remainingBudget: number
  isOverBudget: boolean
  overBudgetBy: number
}

// Find messages that fit within budget
export function findMessagesThatFit(
  messages: Message[],
  tokenBudget: number
): {
  fittingMessages: Message[]
  removedCount: number
  tokensSaved: number
}
```

**Token Counting Logic**:
- **Text blocks**: Use `tokenx` library for estimation
- **Image blocks**: ~85 tokens per image (GPT-4V pricing)
- **File blocks**: Size/4 heuristic for text files
- **Tool blocks**: JSON.stringify(args) + content
- **Citation blocks**: Sum of all result contents
- **Web search**: Result titles + snippets

### 3. Context Strategy Implementations

#### Strategy 1: Sliding Window (Simplest)
**File**: `src/services/contextStrategies/strategies/SlidingWindowStrategy.ts`

**Algorithm**:
1. Start from most recent message
2. Work backwards adding messages
3. Stop when budget is exceeded
4. Return the messages that fit

**No AI required** - Pure logic

**Example**:
- Input: 20 messages (15,234 tokens), budget: 12,000 tokens
- Output: Keep last 12 messages (11,890 tokens)
- Action: Removed messages #1-8

#### Strategy 2: Truncate Middle
**File**: `src/services/contextStrategies/strategies/TruncateMiddleStrategy.ts`

**Algorithm**:
1. Keep first N messages (system context, instructions)
2. Keep last M messages (recent conversation)
3. Remove everything in middle
4. Add omission marker if configured

**No AI required** - Pure logic

**Example**:
- Input: 20 messages
- Config: keepFirst=2, keepLast=6
- Output: Messages #1-2, #15-20 (removed #3-14)
- Marker: "...12 messages omitted..."

#### Strategy 3: Progressive Summarization
**File**: `src/services/contextStrategies/strategies/SummarizationStrategy.ts`

**Two modes**:

**A. Extractive (No AI)**:
- Extract key phrases from messages
- Create bullet-point summary
- Fast and deterministic

**B. AI-Powered (Optional)**:
- Use quick model to generate summary
- More coherent and natural
- Caches summaries for reuse

**Algorithm**:
1. Group messages into chunks (6-10 messages)
2. Summarize each chunk
3. Replace chunks with summary messages
4. Keep recent messages verbatim

**Example**:
- Messages #1-10 → "Discussed pricing, features, and support options"
- Messages #11-20 → Keep verbatim (recent)
- Result: Conversation context preserved, tokens reduced 60%

#### Strategy 4: Hierarchical Memory
**File**: `src/services/contextStrategies/strategies/HierarchicalMemoryStrategy.ts`

**Three tiers**:

**Short-term** (verbatim, ~5 turns):
- Keep most recent exchanges exactly as-is
- No modification

**Mid-term** (summarized, ~2000 tokens):
- Summarize older conversations
- Preserve key context

**Long-term** (facts, ~500 tokens):
- Extract persistent facts/preferences
- User's goals, constraints, preferences
- Key information that spans conversations

**Algorithm**:
1. Identify short-term boundary (last 5 turns)
2. Summarize mid-term messages
3. Extract/update long-term facts
4. Combine all tiers within budget

**Most sophisticated** - Best for long-running conversations

### 4. Configuration Hierarchy

```typescript
interface ContextStrategyConfig {
  type: ContextStrategyType
  
  // Sliding Window
  maxMessages?: number
  
  // Summarization
  summarizationModelId?: string
  summaryMaxTokens?: number
  summarizeThreshold?: number
  
  // Hierarchical
  shortTermTurns?: number
  midTermSummaryTokens?: number
  longTermFactsTokens?: number
  
  // Truncate Middle
  keepFirstMessages?: number
  keepLastMessages?: number
  showOmissionMarker?: boolean
}
```

**Resolution Order**:
1. **Topic level** (most specific) - `topic.contextStrategy`
2. **Assistant level** - `assistant.settings.contextStrategy`
3. **Global level** - `preferences['context.strategy']`
4. **Default** - `{ type: 'none' }` (opt-in for users)

### 5. Database Schema Changes

#### Topics Table
```sql
ALTER TABLE topics ADD COLUMN context_strategy TEXT; -- JSON
ALTER TABLE topics ADD COLUMN context_summary TEXT;
ALTER TABLE topics ADD COLUMN context_facts TEXT; -- JSON array
ALTER TABLE topics ADD COLUMN summary_updated_at INTEGER;
ALTER TABLE topics ADD COLUMN facts_updated_at INTEGER;
```

#### Assistants Settings (JSON field extension)
```typescript
assistant.settings = {
  // ... existing settings ...
  contextStrategy?: ContextStrategyConfig
}
```

#### Global Preferences
```typescript
'context.strategy_type': 'none' | 'sliding_window' | 'summarize' | 'hierarchical' | 'truncate_middle'
'context.strategy_config': JSON  // ContextStrategyConfig
'context.summarization_model_id': string
```

### 6. Integration Points

#### Message Preparation Hook
**File**: `src/services/ConversationService.ts` (NEW or enhance existing)

```typescript
export async function prepareMessagesForModel(
  messages: Message[],
  assistant: Assistant,
  options: { topic?: Topic; systemPrompt?: string }
): Promise<{
  messages: Message[]
  contextSummary?: string
  contextActionBlock?: ContextActionMessageBlock
}> {
  // 1. Apply existing filters
  const filtered = filterMessagesPipeline(messages, contextCount)
  
  // 2. Check if context management needed
  const strategy = getEffectiveStrategyConfig(options.topic, assistant)
  
  if (strategy.type === 'none') {
    return { messages: filtered }
  }
  
  // 3. Apply strategy
  const result = await applyContextStrategy(filtered, model, {
    topic: options.topic,
    assistant,
    systemPrompt: options.systemPrompt
  })
  
  // 4. Create notification block if applied
  let contextActionBlock: ContextActionMessageBlock | undefined
  
  if (result.wasApplied) {
    contextActionBlock = createContextActionBlock({
      action: strategy.type,
      summary: result.summary || generateDefaultSummary(result),
      removedCount: result.messagesRemoved,
      tokensSaved: result.tokensSaved,
      metadata: {
        strategyType: strategy.type,
        originalMessageCount: filtered.length,
        finalMessageCount: result.messages.length,
        contextSummary: result.summary
      }
    })
  }
  
  return {
    messages: result.messages,
    contextSummary: result.summary,
    contextActionBlock
  }
}
```

### 7. Settings UI Components

#### Global Context Settings
**File**: `src/screens/settings/context/ContextManagementSettingsScreen.tsx` (NEW)

```typescript
export function ContextManagementSettingsScreen() {
  const { t } = useTranslation()
  const [strategyType, setStrategyType] = useState<ContextStrategyType>('none')
  
  return (
    <SettingsScreen title={t('settings.context.title')}>
      {/* Strategy Selection */}
      <Section>
        <SectionTitle>{t('settings.context.strategy')}</SectionTitle>
        <Picker
          selectedValue={strategyType}
          onValueChange={setStrategyType}
        >
          <Picker.Item label={t('settings.context.none')} value="none" />
          <Picker.Item label={t('settings.context.sliding_window')} value="sliding_window" />
          <Picker.Item label={t('settings.context.summarize')} value="summarize" />
          <Picker.Item label={t('settings.context.hierarchical')} value="hierarchical" />
          <Picker.Item label={t('settings.context.truncate_middle')} value="truncate_middle" />
        </Picker>
        
        {/* Strategy description */}
        <HelperText>
          {CONTEXT_STRATEGY_DESCRIPTIONS[strategyType]}
        </HelperText>
      </Section>
      
      {/* Strategy-specific settings */}
      {strategyType === 'sliding_window' && (
        <Section>
          <NumberInput
            label={t('settings.context.max_messages')}
            value={config.maxMessages}
            onChange={setMaxMessages}
            placeholder={t('settings.context.auto')}
          />
        </Section>
      )}
      
      {/* ... other strategy-specific settings ... */}
    </SettingsScreen>
  )
}
```

### 8. User Notifications During Processing

**Pattern 1: Progress Indicator** (Roo Code style)
```typescript
// Show while context is being processed
<View className="flex-row items-center gap-2 p-2">
  <ActivityIndicator size="small" />
  <Text className="text-xs text-muted-foreground">
    {t('message.context_action.processing')}
  </Text>
</View>
```

**Pattern 2: Inline Block** (GPT-5 style)
```typescript
// After processing, show as message block
<ContextActionBlock 
  block={contextActionBlock}
  onExpand={() => {/* show details */}}
/>
```

**Pattern 3: Toast Notification** (Optional)
```typescript
// For significant context reductions
toast.info(
  t('message.context_action.applied', {
    strategy: strategyName,
    removed: removedCount
  }),
  { duration: 3000 }
)
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ContextStrategies', () => {
  describe('SlidingWindowStrategy', () => {
    it('keeps messages within token budget', async () => {
      const messages = createTestMessages(20, 1000) // 20K tokens
      const result = await strategy.apply(messages, config, {
        tokenBudget: 12000,
        currentTokens: 20000,
        model: testModel
      })
      
      expect(result.wasApplied).toBe(true)
      expect(result.messages.length).toBeLessThan(20)
      expect(estimateMessagesTokens(result.messages)).toBeLessThanOrEqual(12000)
    })
  })
  
  describe('TruncateMiddleStrategy', () => {
    it('preserves first and last messages', async () => {
      // ... test implementation
    })
  })
  
  describe('ContextActionBlock', () => {
    it('renders collapsed state by default', () => {
      // ... test implementation  
    })
    
    it('expands to show details on tap', () => {
      // ... test implementation
    })
  })
})
```

### Integration Tests

```typescript
describe('Context Management Integration', () => {
  it('applies strategy when over budget', async () => {
    // Create conversation that exceeds model limit
    const messages = await createLongConversation(100)
    const prepared = await prepareMessagesForModel(messages, assistant, { topic })
    
    expect(prepared.contextActionBlock).toBeDefined()
    expect(prepared.messages.length).toBeLessThan(100)
  })
  
  it('creates visible notification block in UI', async () => {
    // ... test implementation
  })
})
```

### Performance Benchmarks

```typescript
describe('Performance', () => {
  it('processes 100 messages in <100ms', async () => {
    const start = performance.now()
    await applyContextStrategy(messages, config, context)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(100)
  })
})
```

---

## i18n Translations Required

### English (`en-us.json`)
```json
{
  "message": {
    "context_action": {
      "title": "Context Management",
      "tap_details": "Tap for details",
      "details": "Details",
      "strategy": "Strategy",
      "removed": "Messages removed",
      "saved": "Tokens saved",
      "processing": "Managing context...",
      "pruned": "Removed {{count}} older messages to stay within model limits",
      "applied": "Applied {{strategy}} strategy (removed {{removed}} messages)"
    }
  },
  "settings": {
    "context": {
      "title": "Context Management",
      "strategy": "Strategy",
      "none": "None (No Management)",
      "sliding_window": "Sliding Window",
      "summarize": "Progressive Summarization",
      "hierarchical": "Hierarchical Memory",
      "truncate_middle": "Keep First & Last",
      "max_messages": "Maximum Messages",
      "auto": "Auto (based on model)",
      "descriptions": {
        "none": "No context management. May exceed model limits on long conversations.",
        "sliding_window": "Keeps only the most recent messages within the token budget. Simple and predictable.",
        "summarize": "Progressively summarizes older messages to preserve key information while reducing tokens.",
        "hierarchical": "Three-tier memory system: recent messages verbatim, older messages summarized, key facts extracted.",
        "truncate_middle": "Preserves initial instructions and recent context, removes middle messages."
      }
    }
  }
}
```

(Similar translations needed for: `ja-jp`, `zh-cn`, `zh-tw`, `ru-ru`)

---

## Migration Considerations

### Backward Compatibility
- Default strategy: `'none'` (no change to existing behavior)
- Opt-in feature (users must enable)
- Existing conversations continue working
- No data migration required initially

### Graceful Degradation
- If strategy fails, fall back to sliding window
- If AI summarization fails, use extractive summarization
- Always preserve at least last user message
- Log errors, don't crash

### Performance
- Target: <100ms for 100 messages
- Use caching for summaries
- Async processing where possible
- Lazy load strategy implementations

---

## Success Metrics

### Quantitative
- ✅ Reduce "input too large" errors by >95%
- ✅ Process 100 messages in <100ms
- ✅ Test coverage >80%
- ✅ Zero crashes from context management

### Qualitative
- ✅ Users understand what happened (transparent)
- ✅ Settings are clear and accessible
- ✅ Notifications are non-intrusive
- ✅ Conversation quality maintained

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Token estimation inaccurate | Use conservative safety margins (90% of limit) |
| Strategy too aggressive | Make removals reversible via undo |
| AI summarization slow | Start with extractive, add AI as enhancement |
| Database performance | Index metadata fields, cache results |

### UX Risks
| Risk | Mitigation |
|------|------------|
| Users confused by notifications | Clear, concise language with examples |
| Too many notifications | Show only significant actions (>3 messages removed) |
| Loss of important context | Hierarchical strategy preserves key facts |
| Settings too complex | Progressive disclosure, smart defaults |

---

## Development Workflow

### Phase 1: Topic Renaming (Immediate - 2-3 hours)
```bash
# 1. Integrate with message streaming
cd /Users/gqadonis/Projects/prometheus/cherry-studio-app
# Edit: src/services/messageStreaming/callbacks/baseCallbacks.ts

# 2. Test
yarn ios  # or yarn android
# Send 2+ messages, observe auto-rename

# 3. Commit
git add .
git commit -m "feat: integrate automatic topic renaming"
```

### Phase 2-4: Context Management (5 weeks)
```bash
# Week 1: Foundation
npx drizzle-kit generate  # After schema changes
yarn test -- TokenService

# Week 2: Basic strategies
yarn test -- SlidingWindowStrategy
yarn test -- TruncateMiddleStrategy

# Week 3: Configuration
yarn test -- configResolver
# Test UI in Settings

# Week 4: Advanced
yarn test -- HierarchicalMemoryStrategy
yarn test -- Integration

# Week 5: Polish
yarn check:i18n
yarn test --coverage
```

---

## Appendix

### A. Desktop Files to Port

**Core System**:
- `src/renderer/src/services/contextStrategies/` (entire directory)
- `src/renderer/src/services/TokenService.ts`
- `src/renderer/src/config/models/contextLimits.ts`
- `src/renderer/src/types/contextStrategy.ts`

**UI Components**:
- `src/renderer/src/pages/home/Messages/Blocks/ContextActionBlock.tsx`
- `src/renderer/src/components/ContextStrategySelector.tsx`
- `src/renderer/src/pages/settings/ModelSettings/ContextManagementSettings.tsx`

**Integration**:
- `src/renderer/src/services/ConversationService.ts`
- `src/renderer/src/services/messageStreaming/callbacks/contextActionCallbacks.ts`

### B. Mobile-Specific Adaptations

1. **React Native UI** - Use HeroUI instead of styled-components
2. **Storage** - Drizzle ORM instead of Dexie
3. **Navigation** - React Navigation instead of Electron router
4. **File system** - Use expo-file-system for file operations
5. **Performance** - Mobile-optimized (battery, memory constraints)

### C. Key Dependencies

**Existing** (already in mobile app):
- `tokenx` - Token estimation
- `lodash` - Utility functions
- `i18next` - Internationalization
- `@cherrystudio/ai-core` - AI operations

**New** (may need to add):
- None! All dependencies already present

---

## Conclusion

This plan provides:
- ✅ **Complete topic renaming** (ready to integrate)
- ✅ **Full context management** (5-week phased approach)
- ✅ **Transparent user notifications** (inline expandable blocks)
- ✅ **Research-informed UX** (best practices from Roo Code, GPT-5, Claude)
- ✅ **Production-ready architecture** (tested patterns from desktop)

**Recommended Approach**:
1. **This week**: Complete Option A (topic renaming integration + testing)
2. **Next 5 weeks**: Implement Option B phase-by-phase
3. **Throughout**: Maintain transparency with users via CONTEXT_ACTION blocks

The system will prevent "input too large" errors while keeping users informed about what's happening to their conversation history.