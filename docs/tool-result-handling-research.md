# Tool Result Handling Research & Best Practices

**Date**: 2025-12-11  
**Context**: Cherry Studio Mobile - Context Management Implementation

## Executive Summary

Large tool results (MCP, web search, code execution) can exceed context limits. This document outlines best practices and implementation strategy for intelligently managing tool results within token budgets.

## Industry Research

### 1. Anthropic Claude
- **Approach**: Condensed summaries with expandable details
- **UI Pattern**: Shows truncated version, user can expand to see full result
- **Token Management**: Automatically condenses results >1000 tokens
- **User Notification**: Clear indicator when results are condensed

### 2. OpenAI ChatGPT
- **Approach**: Progressive summarization
- **Implementation**: Uses GPT-3.5-turbo to summarize long tool outputs
- **Threshold**: Results >2000 tokens are summarized
- **Preservation**: Keeps key data points, removes verbose logs

### 3. Cursor IDE
- **Approach**: Smart truncation with full access
- **UI Pattern**: Shows first/last portions with "...N lines omitted..."
- **Storage**: Full results stored, truncated version sent to AI
- **User Control**: One-click to see full results

### 4. Roo Code (from our plans)
- **Approach**: Transparent notifications
- **UI Pattern**: "Condensing context..." progress indicator
- **Result**: Shows what was done inline in conversation

## Current Cherry Studio Desktop Patterns

From `/Users/gqadonis/Projects/cherry-studio`:
- Uses `TokenService` to estimate all block types including tools
- Applies context strategies to entire message history
- Creates `CONTEXT_ACTION` blocks for transparency
- No specific tool result handling yet (opportunity for enhancement)

## Recommended Approach

### Token Thresholds
```typescript
const TOOL_RESULT_THRESHOLDS = {
  // No action needed
  SAFE: 500,
  
  // Truncate or summarize
  WARNING: 2000,
  
  // Must condense
  CRITICAL: 5000,
  
  // Hard limit (emergency truncation)
  MAXIMUM: 10000
}
```

### Processing Strategy

#### 1. Small Results (<500 tokens)
- **Action**: Include as-is
- **Notification**: None needed

#### 2. Medium Results (500-2000 tokens)
- **Action**: Include with monitoring
- **Notification**: Optional badge on message

#### 3. Large Results (2000-5000 tokens)
- **Action**: Smart truncation or extractive summary
- **Implementation**:
  ```typescript
  // Keep structure, remove verbose content
  if (isJSON(toolResult)) {
    return extractKeyFields(toolResult)
  } else {
    return keepFirstAndLast(toolResult, 1000)
  }
  ```
- **Notification**: CONTEXT_ACTION block explaining truncation
- **Storage**: Full result in metadata

#### 4. Very Large Results (>5000 tokens)
- **Action**: Aggressive summarization
- **Implementation**:
  ```typescript
  // Extractive summary
  const summary = {
    type: toolResponse.tool.name,
    itemCount: results.length,
    preview: results.slice(0, 3),
    note: 'Full results available in message details'
  }
  ```
- **Notification**: Prominent CONTEXT_ACTION block
- **Storage**: Full result in block metadata
- **UI**: Expandable to show full results

### When to Apply

**Proactive** (BEFORE sending to AI):
1. Estimate tool result tokens after tool execution
2. Apply truncation if needed
3. Create CONTEXT_ACTION block
4. Send truncated version to AI
5. Store full version in message metadata

**Benefits**:
- Prevents "input too large" errors
- Transparent to users
- AI gets concise, relevant data
- Users can review full results anytime

## Implementation Plan

### Phase 1: Token Estimation for Tool Results
```typescript
// In TokenService.ts
export function estimateToolResultTokens(
  toolBlock: ToolMessageBlock
): number {
  const content = toolBlock.content || ''
  return estimateTextTokens(JSON.stringify(content))
}
```

### Phase 2: Tool Result Condenser
```typescript
// New file: src/services/ToolResultCondenser.ts
export function condenseToolResult(
  toolBlock: ToolMessageBlock,
  maxTokens: number
): {
  condensed: string
  originalTokens: number
  condensedTokens: number
  wasCondensed: boolean
  summary: string
}
```

### Phase 3: Integration with Message Streaming
```typescript
// In toolCallbacks.ts onToolCallComplete
if (tokenCount > TOOL_RESULT_THRESHOLDS.WARNING) {
  const { condensed, summary } = condenseToolResult(toolBlock, 2000)
  
  // Update tool block with condensed version
  toolBlock.content = condensed
  toolBlock.metadata.fullContent = originalContent
  
  // Create notification block
  const contextActionBlock = createContextActionBlock({
    action: 'tool_result_condensed',
    summary,
    tokensSaved: originalTokens - condensedTokens
  })
  
  blockManager.handleBlockTransition(contextActionBlock, MessageBlockType.CONTEXT_ACTION)
}
```

### Phase 4: UI for Full Results
```typescript
// In ToolMessageBlock component
{toolBlock.metadata?.fullContent && (
  <TouchableOpacity onPress={() => showFullResults(toolBlock)}>
    <Text className="text-xs text-primary">
      View full results ({originalTokens} tokens) →
    </Text>
  </TouchableOpacity>
)}
```

## Token Budget Examples

### Web Search Results
**Typical**: 5-10 results × 500 tokens = 2,500-5,000 tokens
**Strategy**: Keep titles + snippets, remove full content
**Result**: Reduced to ~800 tokens

### MCP Tool Response (File Read)
**Typical**: Large file = 20,000+ tokens
**Strategy**: Keep file metadata + first/last 500 tokens
**Result**: Reduced to ~1,200 tokens

### MCP Tool Response (Database Query)
**Typical**: 100 records × 100 tokens = 10,000 tokens
**Strategy**: Keep first 5 records + count summary
**Result**: Reduced to ~800 tokens

### Code Execution Output
**Typical**: Verbose logs = 3,000-8,000 tokens
**Strategy**: Keep errors + final output only
**Result**: Reduced to ~500 tokens

## User Notification Templates

### Subtle (500-2000 tokens)
```
ℹ️ Tool result optimized (saved ~800 tokens)
```

### Standard (2000-5000 tokens)
```
ℹ️ Tool Result Condensed
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Condensed large tool output to stay within limits:
• Original: 4,234 tokens
• Condensed: 1,200 tokens
• Saved: ~3,000 tokens

[Tap to view full results] ▼
```

### Prominent (>5000 tokens)
```
⚠️ Large Tool Result Summarized
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tool returned very large output (12,450 tokens).
Applied aggressive summarization:
• Type: Web Search
• Results: 50 items
• Showing: Top 5 results
• Saved: ~11,000 tokens

The AI received a concise summary.
Full results available below.

[View Full Results (12,450 tokens)] ▼
```

## Configuration Options

### Global Settings
```typescript
interface ToolResultSettings {
  // Enable automatic condensation
  enabled: boolean
  
  // Thresholds (tokens)
  warningThreshold: number  // Default: 2000
  criticalThreshold: number // Default: 5000
  maxTokens: number         // Default: 10000
  
  // Condensation strategy
  strategy: 'truncate' | 'summarize' | 'extract'
  
  // Notification preferences
  notifyOn: 'always' | 'large_only' | 'never'
}
```

### Per-Tool Overrides
```typescript
// For web search: Always condense
TOOL_CONFIGS.web_search = {
  maxTokens: 2000,
  strategy: 'extract', // Keep titles + snippets
  notifyOn: 'large_only'
}

// For file read: Aggressive truncation
TOOL_CONFIGS.file_read = {
  maxTokens: 1500,
  strategy: 'truncate', // First/last portions
  notifyOn: 'always'
}
```

## Success Metrics

### Technical
- ✅ Tool results never exceed configured limits
- ✅ Condensation processing <50ms
- ✅ Full results accessible to users
- ✅ No loss of critical information

### User Experience
- ✅ Users informed when condensation happens
- ✅ Can easily access full results
- ✅ No surprise "input too large" errors
- ✅ AI responses remain high quality

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Over-aggressive condensation | Loss of context | Allow full result in metadata, user can view |
| Under-estimation of tokens | Still hit limits | Use conservative estimates (safety margin) |
| Processing delays | Poor UX | Process in background, show progress |
| Complex structured data | Information loss | Use smart extraction (preserve keys) |

## References

- Cherry Studio Desktop: context management system
- Anthropic Claude: result condensation patterns
- OpenAI ChatGPT: summarization approach
- Cursor IDE: truncation with full access
- Roo Code: transparent notifications

## Conclusion

**Best Practice**: Proactively check and condense tool results BEFORE adding to context, with full transparency to users via CONTEXT_ACTION blocks.

**Key Principles**:
1. **Measure first** - Estimate tokens before processing
2. **Condense smart** - Preserve structure and key info
3. **Notify always** - Tell users what was done
4. **Store full** - Keep complete results accessible
5. **Test thoroughly** - Ensure no critical data loss

This approach prevents context overflow while maintaining conversation quality and user trust through transparency.