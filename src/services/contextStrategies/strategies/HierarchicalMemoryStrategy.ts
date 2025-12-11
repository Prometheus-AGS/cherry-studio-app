/**
 * Hierarchical Memory Context Management Strategy
 *
 * This strategy implements a three-tier memory system inspired by human memory:
 *
 * 1. Short-term Memory (STM): Recent conversation turns kept verbatim
 *    - Highest fidelity, most recent context
 *    - Configurable number of turns (default: 5)
 *
 * 2. Mid-term Memory (MTM): Summarized sessions from earlier in conversation
 *    - Compressed representation of older exchanges
 *    - Preserves key topics and decisions
 *
 * 3. Long-term Memory (LTM): Extracted key facts and preferences
 *    - Persistent facts: names, preferences, important decisions
 *    - Carried across the entire conversation
 *
 * Advantages:
 * - Best information preservation across long conversations
 * - Mimics natural human memory patterns
 * - Balances recency with important historical context
 *
 * Disadvantages:
 * - Most complex to implement
 * - Requires careful tuning of tier sizes
 *
 * Best for:
 * - Very long conversations (50+ messages)
 * - Conversations where historical context matters
 * - Ongoing projects or relationships
 */

import { loggerService } from '@/services/LoggerService'
import { estimateConversationTokens, estimateSingleMessageTokens } from '@/services/TokenService'
import type { Message } from '@/types/message'
import { getMainTextContent } from '@/utils/messageUtils/find'

import { BaseContextStrategy } from '../types'
import type { ContextStrategyConfig, ContextStrategyContext, ContextStrategyResult } from '../types'

const logger = loggerService.withContext('HierarchicalMemoryStrategy')

/**
 * Structure for the three memory tiers
 */
interface MemoryTiers {
  shortTerm: Message[]
  midTermSummary: string
  longTermFacts: string[]
}

export class HierarchicalMemoryStrategy extends BaseContextStrategy {
  readonly name = 'hierarchical' as const
  readonly description = 'Three-tier memory system: short-term (verbatim), mid-term (summaries), long-term (facts)'

  async apply(
    messages: Message[],
    config: ContextStrategyConfig,
    context: ContextStrategyContext
  ): Promise<ContextStrategyResult> {
    // Check if we need to apply the strategy
    if (!this.shouldApply(context)) {
      logger.debug('Context within budget, no hierarchical management needed', {
        currentTokens: context.currentTokens,
        budget: context.tokenBudget
      })
      return this.noOpResult(messages)
    }

    logger.info('Applying hierarchical memory strategy', {
      messageCount: messages.length,
      currentTokens: context.currentTokens,
      budget: context.tokenBudget
    })

    // Get configuration with defaults
    const shortTermTurns = config.shortTermTurns ?? 5
    const midTermBudget = config.midTermSummaryTokens ?? 2000
    const longTermBudget = config.longTermFactsTokens ?? 500

    // Calculate available budget after system prompt
    const systemPromptTokens = context.systemPrompt
      ? await estimateConversationTokens([], context.systemPrompt)
      : 0
    const availableBudget = context.tokenBudget - systemPromptTokens

    // Build the three tiers
    const tiers = await this.buildMemoryTiers(messages, {
      shortTermTurns,
      midTermBudget,
      longTermBudget,
      availableBudget,
      existingFacts: context.existingFacts,
      existingSummary: context.existingSummary
    })

    // Calculate what was removed/compressed
    let shortTermTokens = 0
    for (const msg of tiers.shortTerm) {
      shortTermTokens += await estimateSingleMessageTokens(msg)
    }

    const midTermTokens = await estimateConversationTokens([], tiers.midTermSummary)
    let longTermTokens = 0
    for (const fact of tiers.longTermFacts) {
      longTermTokens += await estimateConversationTokens([], fact)
    }

    const originalTokens = context.currentTokens - systemPromptTokens
    const newTokens = shortTermTokens + midTermTokens + longTermTokens
    const tokensSaved = originalTokens - newTokens
    const messagesRemoved = messages.length - tiers.shortTerm.length

    logger.info('Hierarchical memory strategy applied', {
      shortTermMessages: tiers.shortTerm.length,
      midTermTokens,
      longTermFacts: tiers.longTermFacts.length,
      tokensSaved,
      messagesRemoved
    })

    // Build combined summary for the context
    const combinedSummary = this.buildCombinedContext(tiers)

    // Ensure conversation starts with a user message
    const finalMessages = this.ensureUserMessageFirst(tiers.shortTerm)

    return {
      messages: finalMessages,
      summary: combinedSummary,
      messagesRemoved,
      tokensSaved,
      wasApplied: messagesRemoved > 0 || tiers.midTermSummary.length > 0,
      extractedFacts: tiers.longTermFacts
    }
  }

  /**
   * Build the three memory tiers from messages
   */
  private async buildMemoryTiers(
    messages: Message[],
    options: {
      shortTermTurns: number
      midTermBudget: number
      longTermBudget: number
      availableBudget: number
      existingFacts?: string[]
      existingSummary?: string
    }
  ): Promise<MemoryTiers> {
    const { shortTermTurns, midTermBudget, longTermBudget, existingFacts, existingSummary } = options

    // 1. Short-term: Keep most recent turns
    // A "turn" is typically a user-assistant pair, but we'll count individual messages
    const shortTermCount = Math.min(shortTermTurns * 2, messages.length) // *2 for user+assistant
    const shortTerm = messages.slice(-shortTermCount)

    // 2. Mid-term: Summarize messages between short-term and the beginning
    const midTermMessages = messages.slice(0, messages.length - shortTermCount)
    let midTermSummary = ''

    if (midTermMessages.length > 0) {
      // Check if we can reuse existing summary
      if (existingSummary && this.canReuseExistingSummary(midTermMessages)) {
        midTermSummary = existingSummary
      } else {
        midTermSummary = await this.createMidTermSummary(midTermMessages, midTermBudget)
      }
    }

    // 3. Long-term: Extract or reuse facts
    let longTermFacts = existingFacts || []

    // If we don't have existing facts, extract them from all messages
    if (longTermFacts.length === 0) {
      longTermFacts = await this.extractLongTermFacts(messages, longTermBudget)
    } else {
      // Check if new facts should be extracted from recent messages
      const newFacts = await this.extractLongTermFacts(shortTerm, Math.floor(longTermBudget / 2))
      longTermFacts = await this.mergeFacts(longTermFacts, newFacts, longTermBudget)
    }

    return {
      shortTerm,
      midTermSummary,
      longTermFacts
    }
  }

  /**
   * Create a mid-term summary from messages
   */
  private async createMidTermSummary(messages: Message[], maxTokens: number): Promise<string> {
    if (messages.length === 0) {
      return ''
    }

    const summaryParts: string[] = []
    summaryParts.push('[Previous Conversation Summary]')

    // Group messages by rough topic/exchange
    let currentTokens = await estimateConversationTokens([], '[Previous Conversation Summary]\n')

    for (const message of messages) {
      const content = await getMainTextContent(message)
      const role = message.role === 'user' ? 'User' : 'Assistant'

      // Create a condensed version
      const condensed = this.condenseMessage(content, 150)
      const entry = `- ${role}: ${condensed}`
      const entryTokens = await estimateConversationTokens([], entry + '\n')

      if (currentTokens + entryTokens <= maxTokens) {
        summaryParts.push(entry)
        currentTokens += entryTokens
      } else {
        // Budget exhausted, add ellipsis and stop
        summaryParts.push('- [Earlier messages omitted...]')
        break
      }
    }

    return summaryParts.join('\n')
  }

  /**
   * Extract long-term facts from messages
   * Simple pattern-based extraction (could be enhanced with AI in future)
   */
  private async extractLongTermFacts(messages: Message[], maxTokens: number): Promise<string[]> {
    const facts: string[] = []
    let currentTokens = 0

    // Patterns for identifying important facts
    const factPatterns = [
      /my name is (\w+)/i,
      /i(?:'m| am) (?:a |an )?(\w+)/i, // Profession/role
      /i prefer (\w+)/i,
      /i like (\w+)/i,
      /i(?:'m| am) working on (.+?)(?:\.|,|$)/i,
      /the project is called (.+?)(?:\.|,|$)/i,
      /we decided to (.+?)(?:\.|,|$)/i,
      /the goal is (.+?)(?:\.|,|$)/i
    ]

    for (const message of messages) {
      if (message.role !== 'user') continue

      const content = await getMainTextContent(message)

      for (const pattern of factPatterns) {
        const match = content.match(pattern)
        if (match) {
          const fact = match[0]
          const factTokens = await estimateConversationTokens([], fact)

          if (currentTokens + factTokens <= maxTokens && !facts.includes(fact)) {
            facts.push(fact)
            currentTokens += factTokens
          }
        }
      }
    }

    return facts
  }

  /**
   * Merge new facts with existing facts within budget
   */
  private async mergeFacts(existing: string[], newFacts: string[], maxTokens: number): Promise<string[]> {
    const merged = [...existing]
    let currentTokens = 0
    for (const fact of existing) {
      currentTokens += await estimateConversationTokens([], fact)
    }

    for (const fact of newFacts) {
      const factTokens = await estimateConversationTokens([], fact)

      // Check for duplicates or similar facts
      const isDuplicate = existing.some(
        (e) => e.toLowerCase().includes(fact.toLowerCase()) || fact.toLowerCase().includes(e.toLowerCase())
      )

      if (!isDuplicate && currentTokens + factTokens <= maxTokens) {
        merged.push(fact)
        currentTokens += factTokens
      }
    }

    return merged
  }

  /**
   * Build combined context from all tiers
   */
  private buildCombinedContext(tiers: MemoryTiers): string {
    const parts: string[] = []

    // Add long-term facts first (most persistent context)
    if (tiers.longTermFacts.length > 0) {
      parts.push('[Key Facts & Preferences]')
      parts.push(tiers.longTermFacts.map((f) => `• ${f}`).join('\n'))
      parts.push('')
    }

    // Add mid-term summary
    if (tiers.midTermSummary) {
      parts.push(tiers.midTermSummary)
      parts.push('')
    }

    return parts.join('\n').trim()
  }

  /**
   * Condense a message to a maximum character length
   */
  private condenseMessage(content: string, maxChars: number): string {
    if (content.length <= maxChars) {
      return content
    }

    // Try to cut at a sentence boundary
    const truncated = content.substring(0, maxChars)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastQuestion = truncated.lastIndexOf('?')
    const lastExclamation = truncated.lastIndexOf('!')

    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)

    if (lastSentenceEnd > maxChars * 0.5) {
      return truncated.substring(0, lastSentenceEnd + 1)
    }

    // Fall back to word boundary
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...'
    }

    return truncated + '...'
  }

  /**
   * Check if existing summary can be reused
   */
  private canReuseExistingSummary(_messages: Message[]): boolean {
    // In production, this would check if the messages match what was summarized
    // For now, return false to always regenerate
    return false
  }

  /**
   * Ensure the message array starts with a user message
   */
  private ensureUserMessageFirst(messages: Message[]): Message[] {
    if (messages.length === 0) {
      return messages
    }

    const firstUserIndex = messages.findIndex((m) => m.role === 'user')

    if (firstUserIndex <= 0) {
      return messages
    }

    return messages.slice(firstUserIndex)
  }
}