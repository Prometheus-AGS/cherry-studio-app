/**
 * Sliding Window Context Strategy
 *
 * This strategy keeps only the most recent messages that fit within the token budget.
 * It's the simplest and most predictable strategy.
 *
 * Algorithm:
 * 1. Start from the most recent message
 * 2. Work backwards, adding messages to the result
 * 3. Stop when adding the next message would exceed the budget
 * 4. Return the messages that fit
 *
 * Advantages:
 * - Simple and predictable
 * - No AI calls needed
 * - Fast execution (<10ms for 100 messages)
 * - Preserves most recent context
 *
 * Disadvantages:
 * - Loses older context completely
 * - No summarization of removed messages
 */

import { loggerService } from '@/services/LoggerService'
import { estimateConversationTokens, findMessagesThatFit } from '@/services/TokenService'
import type { Message } from '@/types/message'

import { BaseContextStrategy } from '../types'
import type { ContextStrategyConfig, ContextStrategyContext, ContextStrategyResult } from '../types'

const logger = loggerService.withContext('SlidingWindowStrategy')

export class SlidingWindowStrategy extends BaseContextStrategy {
  readonly name = 'sliding_window' as const
  readonly description = 'Keeps only the most recent messages within the token budget. Simple and predictable.'

  async apply(
    messages: Message[],
    config: ContextStrategyConfig,
    context: ContextStrategyContext
  ): Promise<ContextStrategyResult> {
    // Check if we're over budget
    if (!this.shouldApply(context)) {
      logger.debug('Sliding window not needed - within budget', {
        currentTokens: context.currentTokens,
        tokenBudget: context.tokenBudget
      })
      return this.noOpResult(messages)
    }

    logger.info('Applying sliding window strategy', {
      messageCount: messages.length,
      currentTokens: context.currentTokens,
      tokenBudget: context.tokenBudget,
      overBudget: context.currentTokens - context.tokenBudget
    })

    const startTime = performance.now()

    // If maxMessages is configured, respect it
    let candidateMessages = messages
    if (config.maxMessages && config.maxMessages > 0) {
      const maxCount = Math.min(config.maxMessages, messages.length)
      candidateMessages = messages.slice(-maxCount) // Keep last N messages
      
      logger.debug('Applied maxMessages limit', {
        maxMessages: config.maxMessages,
        originalCount: messages.length,
        candidateCount: candidateMessages.length
      })
    }

    // Calculate system prompt tokens if present
    const systemPromptTokens = context.systemPrompt
      ? await estimateConversationTokens([], context.systemPrompt)
      : 0

    // Find messages that fit within budget
    const { fittingMessages, removedCount, tokensSaved } = await findMessagesThatFit(
      candidateMessages,
      context.tokenBudget,
      systemPromptTokens
    )

    const duration = performance.now() - startTime

    if (fittingMessages.length === candidateMessages.length) {
      // All messages fit, no need to apply strategy
      logger.debug('All candidate messages fit within budget', {
        messageCount: fittingMessages.length,
        duration: `${duration.toFixed(2)}ms`
      })
      return this.noOpResult(messages)
    }

    // Ensure we have at least one message
    if (fittingMessages.length === 0 && messages.length > 0) {
      // Take at least the last message
      fittingMessages.push(messages[messages.length - 1])
      logger.warn('No messages fit in budget, keeping last message only', {
        lastMessageId: messages[messages.length - 1].id
      })
    }

    logger.info('Sliding window strategy applied successfully', {
      originalCount: messages.length,
      finalCount: fittingMessages.length,
      removedCount,
      tokensSaved,
      duration: `${duration.toFixed(2)}ms`
    })

    return {
      messages: fittingMessages,
      messagesRemoved: removedCount,
      tokensSaved,
      wasApplied: true
    }
  }
}