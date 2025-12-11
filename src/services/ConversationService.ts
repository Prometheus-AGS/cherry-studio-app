import type { ModelMessage } from 'ai'
import { findLast, takeRight } from 'lodash'

import { convertMessagesToSdkMessages } from '@/aiCore/prepareParams'
import { applyContextStrategy, getEffectiveStrategyConfig, isContextStrategyEnabled } from '@/services/contextStrategies'
import type { Assistant, Topic } from '@/types/assistant'
import type { ContextActionMessageBlock, Message } from '@/types/message'
import { MessageBlockStatus, MessageBlockType } from '@/types/message'
import {
  filterAdjacentUserMessaegs,
  filterAfterContextClearMessages,
  filterEmptyMessages,
  filterErrorOnlyMessagesWithRelated,
  filterLastAssistantMessage,
  filterUsefulMessages,
  filterUserRoleStartMessages
} from '@/utils/messageUtils/filters'

import { getAssistantSettings, getDefaultModel } from './AssistantService'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('ConversationService')

/**
 * Generate a default summary message for context actions
 */
function generateDefaultSummary(
  result: { messagesRemoved: number; tokensSaved: number },
  strategyType: string
): string {
  const parts: string[] = []

  parts.push(`Applied ${strategyType} strategy`)

  if (result.messagesRemoved > 0) {
    parts.push(`Removed ${result.messagesRemoved} message${result.messagesRemoved === 1 ? '' : 's'}`)
  }

  if (result.tokensSaved > 0) {
    parts.push(`Saved ~${result.tokensSaved.toLocaleString()} tokens`)
  }

  return parts.join(' • ')
}

export class ConversationService {
  /**
   * Applies the filtering pipeline that prepares UI messages for model consumption.
   * This keeps the logic testable and prevents future regressions when the pipeline changes.
   */
  static filterMessagesPipeline(messages: Message[], contextCount: number): Message[] {
    const messagesAfterContextClear = filterAfterContextClearMessages(messages)
    const usefulMessages = filterUsefulMessages(messagesAfterContextClear)
    // Run the error-only filter before trimming trailing assistant responses so the pair is removed together.
    const withoutErrorOnlyPairs = filterErrorOnlyMessagesWithRelated(usefulMessages)
    const withoutTrailingAssistant = filterLastAssistantMessage(withoutErrorOnlyPairs)
    const withoutAdjacentUsers = filterAdjacentUserMessaegs(withoutTrailingAssistant)
    const limitedByContext = takeRight(withoutAdjacentUsers, contextCount + 2)
    const contextClearFiltered = filterAfterContextClearMessages(limitedByContext)
    const nonEmptyMessages = filterEmptyMessages(contextClearFiltered)
    const userRoleStartMessages = filterUserRoleStartMessages(nonEmptyMessages)
    return userRoleStartMessages
  }

  static async prepareMessagesForModel(
    messages: Message[],
    assistant: Assistant,
    options: {
      topic?: Topic
      systemPrompt?: string
      maxOutputTokens?: number
    } = {}
  ): Promise<{
    modelMessages: ModelMessage[]
    uiMessages: Message[]
    contextSummary?: string
    contextActionBlock?: ContextActionMessageBlock
    contextManagementApplied: boolean
  }> {
    const { topic, systemPrompt, maxOutputTokens } = options
    const { contextCount } = getAssistantSettings(assistant)
    const model = assistant.model || getDefaultModel()

    // This logic is extracted from the original ApiService.fetchChatCompletion
    const lastUserMessage = findLast(messages, m => m.role === 'user')

    if (!lastUserMessage) {
      return {
        modelMessages: [],
        uiMessages: [],
        contextManagementApplied: false
      }
    }

    // Step 1: Apply the existing message filtering pipeline
    let uiMessagesFromPipeline = ConversationService.filterMessagesPipeline(messages, contextCount)
    logger.debug('uiMessagesFromPipeline', { count: uiMessagesFromPipeline.length })

    // Fallback: ensure at least the last user message is present to avoid empty payloads
    if ((!uiMessagesFromPipeline || uiMessagesFromPipeline.length === 0) && lastUserMessage) {
      uiMessagesFromPipeline = [lastUserMessage]
    }

    // Step 2: Apply context management strategy if enabled
    const strategyConfig = getEffectiveStrategyConfig(topic, assistant)
    let contextSummary: string | undefined
    let contextActionBlock: ContextActionMessageBlock | undefined
    let contextManagementApplied = false
    let finalUiMessages = uiMessagesFromPipeline

    if (isContextStrategyEnabled(strategyConfig)) {
      logger.debug('Applying context management strategy', {
        strategyType: strategyConfig.type,
        messageCount: uiMessagesFromPipeline.length
      })

      const strategyResult = await applyContextStrategy(uiMessagesFromPipeline, model, {
        topic,
        assistant,
        systemPrompt,
        maxOutputTokens,
        existingSummary: topic?.contextSummary,
        existingFacts: topic?.contextFacts
      })

      if (strategyResult.wasApplied) {
        finalUiMessages = strategyResult.messages
        contextSummary = strategyResult.summary
        contextManagementApplied = true

        // Create context action block for UI notification
        contextActionBlock = {
          id: `context-action-${Date.now()}`,
          messageId: '', // Will be set by caller
          type: MessageBlockType.CONTEXT_ACTION,
          createdAt: Date.now(),
          status: MessageBlockStatus.SUCCESS,
          action: strategyConfig.type as any,
          summary: strategyResult.summary || generateDefaultSummary(strategyResult, strategyConfig.type),
          removedCount: strategyResult.messagesRemoved,
          tokensSaved: strategyResult.tokensSaved,
          metadata: {
            strategyType: strategyConfig.type,
            originalMessageCount: uiMessagesFromPipeline.length,
            finalMessageCount: strategyResult.messages.length,
            contextSummary: strategyResult.summary,
            keptMessageIds: strategyResult.messages.map(m => m.id)
          }
        }

        logger.info('Context management applied', {
          strategy: strategyConfig.type,
          originalCount: uiMessagesFromPipeline.length,
          finalCount: finalUiMessages.length,
          messagesRemoved: strategyResult.messagesRemoved,
          tokensSaved: strategyResult.tokensSaved
        })
      }
    }

    return {
      modelMessages: await convertMessagesToSdkMessages(finalUiMessages, model),
      uiMessages: finalUiMessages,
      contextSummary,
      contextActionBlock,
      contextManagementApplied
    }
  }

  static needsWebSearch(assistant: Assistant): boolean {
    return !!assistant.webSearchProviderId
  }

  static needsKnowledgeSearch(_assistant: Assistant): boolean {
    return false
    // return !isEmpty(assistant.knowledge_bases)
  }
}
