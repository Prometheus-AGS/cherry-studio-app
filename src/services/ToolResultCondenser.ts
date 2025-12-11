/**
 * Tool Result Condenser Service
 *
 * Manages large tool call results to prevent context overflow.
 * Based on research from docs/tool-result-handling-research.md
 */

import { loggerService } from './LoggerService'
import { estimateToolResultTokens, estimateTextTokens } from './TokenService'

const logger = loggerService.withContext('ToolResultCondenser')

/**
 * Token thresholds for tool result handling
 */
export const TOOL_RESULT_THRESHOLDS = {
  /** No action needed - include as-is */
  SAFE: 500,
  
  /** Monitor but include - may want to notify */
  WARNING: 2000,
  
  /** Must condense/truncate */
  CRITICAL: 5000,
  
  /** Emergency hard limit - aggressive truncation */
  MAXIMUM: 10000
} as const

/**
 * Condensation strategies
 */
export type CondensationStrategy = 'truncate' | 'extract' | 'summarize'

/**
 * Result of condensing a tool result
 */
export interface CondensationResult {
  /** Condensed content to send to AI */
  condensedContent: string
  
  /** Original content (for storage) */
  originalContent: string
  
  /** Estimated original tokens */
  originalTokens: number
  
  /** Estimated condensed tokens */
  condensedTokens: number
  
  /** Whether condensation was applied */
  wasCondensed: boolean
  
  /** Human-readable summary of what was done */
  summary: string
  
  /** Strategy used */
  strategy?: CondensationStrategy
}

/**
 * Check if tool result needs condensation
 *
 * @param toolResult - The tool result content
 * @param maxTokens - Maximum allowed tokens (default: CRITICAL threshold)
 * @returns Whether condensation is needed and current token count
 */
export function shouldCondenseToolResult(
  toolResult: any,
  maxTokens: number = TOOL_RESULT_THRESHOLDS.CRITICAL
): {
  shouldCondense: boolean
  currentTokens: number
  threshold: keyof typeof TOOL_RESULT_THRESHOLDS
} {
  const currentTokens = estimateToolResultTokens(toolResult)
  
  let threshold: keyof typeof TOOL_RESULT_THRESHOLDS = 'SAFE'
  if (currentTokens > TOOL_RESULT_THRESHOLDS.MAXIMUM) {
    threshold = 'MAXIMUM'
  } else if (currentTokens > TOOL_RESULT_THRESHOLDS.CRITICAL) {
    threshold = 'CRITICAL'
  } else if (currentTokens > TOOL_RESULT_THRESHOLDS.WARNING) {
    threshold = 'WARNING'
  }
  
  const shouldCondense = currentTokens > maxTokens
  
  return {
    shouldCondense,
    currentTokens,
    threshold
  }
}

/**
 * Condense tool result to fit within token budget
 *
 * @param toolResult - The tool result content (any type)
 * @param maxTokens - Maximum tokens allowed
 * @param toolName - Name of the tool (for strategy selection)
 * @returns Condensation result
 */
export function condenseToolResult(
  toolResult: any,
  maxTokens: number = TOOL_RESULT_THRESHOLDS.CRITICAL,
  toolName?: string
): CondensationResult {
  const originalContent = typeof toolResult === 'string' 
    ? toolResult 
    : JSON.stringify(toolResult, null, 2)
  
  const originalTokens = estimateToolResultTokens(toolResult)
  
  // Check if condensation needed
  if (originalTokens <= maxTokens) {
    return {
      condensedContent: originalContent,
      originalContent,
      originalTokens,
      condensedTokens: originalTokens,
      wasCondensed: false,
      summary: 'Tool result within limits'
    }
  }
  
  // Select strategy based on tool type and result structure
  let strategy: CondensationStrategy
  let condensedContent: string
  
  try {
    // Try to parse as JSON for smart extraction
    const parsed = typeof toolResult === 'string' 
      ? JSON.parse(toolResult) 
      : toolResult
    
    // Strategy selection based on structure
    if (Array.isArray(parsed)) {
      strategy = 'extract'
      condensedContent = extractFromArray(parsed, maxTokens)
    } else if (typeof parsed === 'object' && parsed !== null) {
      strategy = 'extract'
      condensedContent = extractFromObject(parsed, maxTokens)
    } else {
      strategy = 'truncate'
      condensedContent = truncateText(originalContent, maxTokens)
    }
  } catch {
    // Not JSON - use simple truncation
    strategy = 'truncate'
    condensedContent = truncateText(originalContent, maxTokens)
  }
  
  const condensedTokens = estimateTextTokens(condensedContent)
  const tokensSaved = originalTokens - condensedTokens
  
  const summary = generateSummary(
    strategy,
    originalTokens,
    condensedTokens,
    tokensSaved,
    toolName
  )
  
  logger.info('Tool result condensed', {
    toolName,
    strategy,
    originalTokens,
    condensedTokens,
    tokensSaved
  })
  
  return {
    condensedContent,
    originalContent,
    originalTokens,
    condensedTokens,
    wasCondensed: true,
    summary,
    strategy
  }
}

/**
 * Extract key information from array results
 */
function extractFromArray(arr: any[], maxTokens: number): string {
  const itemCount = arr.length
  
  // Calculate how many items we can include
  const sampleSize = Math.min(5, Math.floor(itemCount / 2))
  const sample = arr.slice(0, sampleSize)
  
  const result = {
    type: 'array',
    totalItems: itemCount,
    showing: sampleSize,
    sample,
    note: itemCount > sampleSize 
      ? `Showing first ${sampleSize} of ${itemCount} items. Full results in metadata.`
      : undefined
  }
  
  return JSON.stringify(result, null, 2)
}

/**
 * Extract key fields from object results
 */
function extractFromObject(obj: any, maxTokens: number): string {
  // Keep important keys, truncate values
  const important = [
    'id', 'name', 'title', 'type', 'status', 
    'error', 'message', 'description', 'summary'
  ]
  
  const extracted: any = {}
  const allKeys = Object.keys(obj)
  
  // Include important fields first
  for (const key of allKeys) {
    if (important.includes(key.toLowerCase())) {
      const value = obj[key]
      extracted[key] = typeof value === 'string' && value.length > 500
        ? value.slice(0, 500) + '...'
        : value
    }
  }
  
  // Add metadata about omitted fields
  const omittedKeys = allKeys.filter(k => !important.includes(k.toLowerCase()))
  if (omittedKeys.length > 0) {
    extracted._omitted = {
      count: omittedKeys.length,
      keys: omittedKeys.slice(0, 10),
      note: 'Full object available in metadata'
    }
  }
  
  return JSON.stringify(extracted, null, 2)
}

/**
 * Truncate text content while preserving structure
 */
function truncateText(text: string, maxTokens: number): string {
  // Estimate characters per token (rough: 4 chars = 1 token)
  const maxChars = maxTokens * 4
  
  if (text.length <= maxChars) {
    return text
  }
  
  // Keep first and last portions
  const keepSize = Math.floor(maxChars / 2)
  const first = text.slice(0, keepSize)
  const last = text.slice(-keepSize)
  const omitted = text.length - (keepSize * 2)
  
  return `${first}\n\n[... ${omitted} characters omitted ...]\n\n${last}`
}

/**
 * Generate human-readable summary of condensation
 */
function generateSummary(
  strategy: CondensationStrategy,
  originalTokens: number,
  condensedTokens: number,
  tokensSaved: number,
  toolName?: string
): string {
  const toolInfo = toolName ? ` from ${toolName}` : ''
  
  switch (strategy) {
    case 'extract':
      return `Extracted key information${toolInfo}: ${originalTokens} → ${condensedTokens} tokens (saved ~${tokensSaved})`
    
    case 'truncate':
      return `Truncated large output${toolInfo}: ${originalTokens} → ${condensedTokens} tokens (saved ~${tokensSaved})`
    
    case 'summarize':
      return `Summarized result${toolInfo}: ${originalTokens} → ${condensedTokens} tokens (saved ~${tokensSaved})`
    
    default:
      return `Condensed tool result: saved ~${tokensSaved} tokens`
  }
}

/**
 * Get recommended threshold for a specific tool
 *
 * Different tools have different optimal thresholds
 */
export function getToolThreshold(toolName: string): number {
  const toolThresholds: Record<string, number> = {
    // Web search: Keep titles + snippets only
    builtin_web_search: TOOL_RESULT_THRESHOLDS.WARNING,
    web_search: TOOL_RESULT_THRESHOLDS.WARNING,
    
    // File operations: Aggressive truncation
    read_file: 1500,
    list_files: TOOL_RESULT_THRESHOLDS.WARNING,
    
    // Database queries: Keep first N records
    database_query: TOOL_RESULT_THRESHOLDS.WARNING,
    
    // Code execution: Keep errors + final output
    execute_code: TOOL_RESULT_THRESHOLDS.WARNING,
    
    // Default for unknown tools
    default: TOOL_RESULT_THRESHOLDS.CRITICAL
  }
  
  return toolThresholds[toolName] || toolThresholds.default
}

/**
 * Check if notification should be shown for this condensation
 *
 * @param tokensSaved - Number of tokens saved
 * @param threshold - The threshold that was hit
 * @returns Whether to show notification to user
 */
export function shouldNotifyUser(
  tokensSaved: number,
  threshold: keyof typeof TOOL_RESULT_THRESHOLDS
): boolean {
  // Always notify for critical/maximum thresholds
  if (threshold === 'CRITICAL' || threshold === 'MAXIMUM') {
    return true
  }
  
  // Notify for warning if significant savings (>1000 tokens)
  if (threshold === 'WARNING' && tokensSaved > 1000) {
    return true
  }
  
  // Don't notify for safe threshold
  return false
}