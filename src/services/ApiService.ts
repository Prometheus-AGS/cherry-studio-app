/**
 * ApiService - AI API service functions
 *
 * Provides atomic, stateless API call functions for AI operations
 */

import { messageBlockDatabase } from '@database'
import { t } from 'i18next'
import { takeRight } from 'lodash'

import { ModernAiProvider } from '@/aiCore'
import { getDefaultModel } from '@/services/AssistantService'
import { loggerService } from '@/services/LoggerService'
import { preferenceService } from '@/services/PreferenceService'
import { getProviderByModel } from '@/services/ProviderService'
import type { Assistant } from '@/types/assistant'
import type { Message } from '@/types/message'

const logger = loggerService.withContext('ApiService')

/**
 * Extract text content from message blocks
 *
 * @param message - Message to extract content from
 * @returns Extracted text content
 */
async function extractMessageContent(message: Message): Promise<string> {
  try {
    if (!message.blocks || message.blocks.length === 0) {
      return ''
    }

    // Load all blocks for this message
    const blocks = await Promise.all(message.blocks.map((blockId) => messageBlockDatabase.getBlockById(blockId)))

    // Extract text from main text blocks
    const textBlocks = blocks
      .filter((block) => block && block.type === 'main_text')
      .map((block) => (block as any).content || '')
      .filter(Boolean)

    return textBlocks.join('\n\n')
  } catch (error) {
    logger.error('Failed to extract message content:', error as Error, { messageId: message.id })
    return ''
  }
}

/**
 * Generate a topic name from messages using AI
 *
 * @param messages - Array of messages to summarize
 * @param assistant - Assistant configuration
 * @returns Generated topic name or null if generation fails
 */
export async function fetchMessagesSummary({
  messages,
  assistant
}: {
  messages: Message[]
  assistant: Assistant
}): Promise<string | null> {
  try {
    // Get naming prompt from preferences
    let prompt = preferenceService.getCached('topic.naming_prompt') || t('prompts.title')

    // Get the model to use for summary generation (use assistant's model or default)
    const model = assistant.model || getDefaultModel()
    const provider = getProviderByModel(model)

    // Take last 5 messages for context
    const contextMessages = takeRight(messages, 5)

    if (contextMessages.length === 0) {
      logger.warn('No messages to summarize')
      return null
    }

    // Extract content from messages
    const structuredMessages = await Promise.all(
      contextMessages.map(async (message) => ({
        role: message.role,
        content: await extractMessageContent(message)
      }))
    )

    // Filter out messages without content
    const validMessages = structuredMessages.filter((m) => m.content.trim().length > 0)

    if (validMessages.length === 0) {
      logger.warn('No valid messages with content to summarize')
      return null
    }

    // Create conversation context for AI
    const conversation = JSON.stringify(validMessages)

    logger.info('Generating topic summary with AI', {
      messageCount: validMessages.length,
      assistantId: assistant.id,
      modelId: model.id
    })

    try {
      // Use aiCore to generate summary
      const aiProvider = new ModernAiProvider(model, provider)

      const summaryAssistant = {
        ...assistant,
        prompt,
        model,
        settings: {
          ...assistant.settings,
          // Disable reasoning for faster summary generation
          reasoning_effort: undefined
        }
      }

      const result = await aiProvider.completions(model.id, {
        system: prompt,
        prompt: conversation
      }, {
        assistant: summaryAssistant,
        callType: 'summary',
        streamOutput: false,
        enableReasoning: false,
        isPromptToolUse: false,
        isSupportedToolUse: false,
        isImageGenerationEndpoint: false,
        enableWebSearch: false,
        enableGenerateImage: false,
        enableUrlContext: false,
        mcpTools: []
      })

      const summaryText = result.getText()
      
      if (summaryText) {
        return removeSpecialCharactersForTopicName(summaryText)
      }
    } catch (error) {
      logger.error('AI summary generation failed, using fallback:', error as Error)
      
      // Fallback to simple extraction from first user message
      const firstUserMessage = validMessages.find((m) => m.role === 'user')
      if (firstUserMessage?.content) {
        const summary = removeSpecialCharactersForTopicName(firstUserMessage.content.substring(0, 50))
        return summary || null
      }
    }

    return null
  } catch (error) {
    logger.error('Failed to generate topic summary:', error as Error)
    return null
  }
}

/**
 * Remove special characters that aren't suitable for topic names
 *
 * @param text - Text to clean
 * @returns Cleaned text
 */
export function removeSpecialCharactersForTopicName(text: string): string {
  return text
    .replace(/[*#`[\]]/g, '') // Remove markdown formatting
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
}

/**
 * Stub exports for functions used elsewhere
 * These reference implementations from other services
 * TODO: Refactor to consolidate API functions
 */

/**
 * Fetch and apply topic naming
 * This triggers the automatic topic renaming functionality
 *
 * @param topicId - The topic ID to rename
 * @param forceRename - Force rename even if already named (optional)
 */
export async function fetchTopicNaming(topicId: string, forceRename?: boolean): Promise<void> {
  // Import dynamically to avoid circular dependency
  const { autoRenameTopic } = await import('@/hooks/useTopic')
  const { topicService } = await import('@/services/TopicService')
  const { assistantService } = await import('@/services/AssistantService')
  
  try {
    const topic = await topicService.getTopic(topicId)
    if (!topic) {
      logger.warn('Topic not found for naming:', topicId)
      return
    }
    
    const assistant = await assistantService.getAssistant(topic.assistantId)
    if (!assistant) {
      logger.warn('Assistant not found for topic naming:', topic.assistantId)
      return
    }
    
    await autoRenameTopic(assistant, topicId)
  } catch (error) {
    logger.error('fetchTopicNaming failed:', error as Error, { topicId, forceRename })
  }
}

// Placeholder stubs - these should be implemented or imported from correct service
export async function checkApi(_provider: any, _model: any, _timeout?: number): Promise<void> {
  // TODO: Implement API check or import from correct service
  throw new Error('checkApi not yet implemented in mobile app')
}

export async function fetchModels(_provider: any): Promise<any[]> {
  // TODO: Implement model fetching or import from ProviderService
  throw new Error('fetchModels not yet implemented - use ProviderService instead')
}

export async function fetchChatCompletion(_params: any): Promise<any> {
  // TODO: Implement or import from OrchestrationService
  throw new Error('fetchChatCompletion not yet implemented - use OrchestrationService instead')
}
