/**
 * Progressive Summarization Context Management Strategy
 *
 * This strategy compresses older messages by summarizing them.
 * The summary is prepended to the context, preserving key information while
 * dramatically reducing token usage.
 *
 * Algorithm:
 * 1. Keep recent messages verbatim (short-term memory)
 * 2. Summarize older messages into a condensed form
 * 3. Inject the summary as context for the model
 *
 * Advantages:
 * - Preserves important information from older messages
 * - Allows much longer effective conversations
 * - Maintains continuity across long interactions
 *
 * Disadvantages:
 * - Some nuance may be lost in summarization
 * - Summary quality depends on extraction algorithm
 *
 * Note: Currently uses extractive summarization (no AI calls).
 * Future enhancement: Add AI-powered summarization option.
 */

import { loggerService } from '@/services/LoggerService'
import { estimateConversationTokens, estimateSingleMessageTokens } from '@/services/TokenService'
import type { Message } from '@/types/message'
import { getMainTextContent } from '@/utils/messageUtils/find'

import type { ContextStrategyConfig, ContextStrategyContext, ContextStrategyResult } from '../types'
import { BaseContextStrategy } from '../types'

const logger = loggerService.withContext('SummarizationStrategy')

/**
 * Default prompt for summarizing conversation history (for future AI integration)
 */
export const SUMMARIZATION_SYSTEM_PROMPT = `You are a conversation summarizer. Your task is to create a concise summary of the conversation history provided below.

Requirements:
1. Capture the key topics, decisions, and important information discussed
2. Preserve any specific facts, numbers, names, or technical details mentioned
3. Note any ongoing tasks, requests, or unresolved questions
4. Keep the summary factual and objective
5. Use bullet points for clarity when appropriate
6. The summary should be self-contained and understandable without the original conversation

Output only the summary, no additional commentary.`

export const SUMMARIZATION_USER_PROMPT = `Please summarize the following conversation history:

{conversation}

Provide a concise summary that captures the essential information.`

export class SummarizationStrategy extends BaseContextStrategy {
  readonly name = 'summarize' as const
  readonly description = 'Progressively summarizes older messages to preserve key information while reducing tokens'

  async apply(
    messages: Message[],
    config: ContextStrategyConfig,
    context: ContextStrategyContext
  ): Promise<ContextStrategyResult> {
    // Check if we need to apply the strategy
    if (!this.shouldApply(context)) {
      logger.debug('Context within budget, no summarization needed', {
        currentTokens: context.currentTokens,
        budget: context.tokenBudget
      })
      return this.noOpResult(messages)
    }

    // Check minimum message threshold
    const summarizeThreshold = config.summarizeThreshold ?? 6
    if (messages.length < summarizeThreshold) {
      logger.debug('Not enough messages to summarize, falling back to sliding window', {
        messageCount: messages.length,
        threshold: summarizeThreshold
      })
      return this.fallbackToSlidingWindow(messages, config, context)
    }

    logger.info('Applying summarization strategy', {
      messageCount: messages.length,
      currentTokens: context.currentTokens,
      budget: context.tokenBudget
    })

    // Calculate how many recent messages to keep verbatim
    const systemPromptTokens = context.systemPrompt
      ? await estimateConversationTokens([], context.systemPrompt)
      : 0
    const summaryBudget = config.summaryMaxTokens ?? 500
    const availableForMessages = context.tokenBudget - systemPromptTokens - summaryBudget

    // Find the split point: how many recent messages fit in the budget
    const { recentMessages, messagesToSummarize } = await this.splitMessages(messages, availableForMessages)

    if (messagesToSummarize.length === 0) {
      logger.debug('All messages fit in budget after reserving summary space')
      return this.noOpResult(messages)
    }

    // Generate summary
    const summary = await this.generateSummary(messagesToSummarize, config, context)

    // Calculate tokens saved
    let originalTokens = 0
    for (const msg of messagesToSummarize) {
      originalTokens += await estimateSingleMessageTokens(msg)
    }
    const summaryTokens = await estimateConversationTokens([], summary)
    const tokensSaved = originalTokens - summaryTokens

    logger.info('Summarization complete', {
      summarizedCount: messagesToSummarize.length,
      recentCount: recentMessages.length,
      originalTokens,
      summaryTokens,
      tokensSaved
    })

    // Ensure conversation starts with a user message
    const finalMessages = this.ensureUserMessageFirst(recentMessages)

    return {
      messages: finalMessages,
      summary,
      messagesRemoved: messagesToSummarize.length,
      tokensSaved,
      wasApplied: true
    }
  }

  /**
   * Split messages into those to summarize and those to keep verbatim
   */
  private async splitMessages(
    messages: Message[],
    availableBudget: number
  ): Promise<{
    recentMessages: Message[]
    messagesToSummarize: Message[]
  }> {
    const recentMessages: Message[] = []
    let recentTokens = 0

    // Work backwards from most recent, keeping messages that fit
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      const tokens = await estimateSingleMessageTokens(message)

      if (recentTokens + tokens <= availableBudget) {
        recentMessages.unshift(message)
        recentTokens += tokens
      } else {
        // Everything before this point needs to be summarized
        break
      }
    }

    // Messages to summarize are everything not in recentMessages
    const recentIds = new Set(recentMessages.map((m) => m.id))
    const messagesToSummarize = messages.filter((m) => !recentIds.has(m.id))

    return { recentMessages, messagesToSummarize }
  }

  /**
   * Generate a summary of the given messages
   * Currently uses extractive approach (no AI calls)
   */
  private async generateSummary(
    messages: Message[],
    _config: ContextStrategyConfig,
    _context: ContextStrategyContext
  ): Promise<string> {
    logger.debug('Generating extractive summary', {
      messageCount: messages.length
    })

    // Use extractive summarization (no AI needed)
    return this.createExtractiveSummary(messages)
  }

  /**
   * Create a simple extractive summary without LLM
   * This extracts key parts of messages
   */
  private async createExtractiveSummary(messages: Message[]): Promise<string> {
    const summaryParts: string[] = []
    const maxCharsPerMessage = 200 // Limit characters per message in summary

    summaryParts.push('[Conversation Summary]')

    for (const message of messages) {
      const content = await getMainTextContent(message)
      const role = message.role === 'user' ? 'User' : 'Assistant'

      if (content.length <= maxCharsPerMessage) {
        summaryParts.push(`- ${role}: ${content}`)
      } else {
        // Extract first part and indicate truncation
        const truncated = content.substring(0, maxCharsPerMessage).trim()
        const lastSpace = truncated.lastIndexOf(' ')
        const cleanTruncated = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
        summaryParts.push(`- ${role}: ${cleanTruncated}...`)
      }
    }

    return summaryParts.join('\n')
  }

  /**
   * Fallback to sliding window when we can't summarize
   */
  private async fallbackToSlidingWindow(
    messages: Message[],
    config: ContextStrategyConfig,
    context: ContextStrategyContext
  ): Promise<ContextStrategyResult> {
    const { SlidingWindowStrategy } = await import('./SlidingWindowStrategy')
    const slidingWindow = new SlidingWindowStrategy()
    return slidingWindow.apply(messages, config, context)
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