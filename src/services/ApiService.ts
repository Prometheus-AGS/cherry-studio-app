/**
 * ApiService - AI API service functions
 *
 * Provides atomic, stateless API call functions for AI operations
 */

import { messageBlockDatabase } from '@database'
import { t } from 'i18next'
import { cloneDeep, takeRight } from 'lodash'

import ModernAiProvider, { type ModernAiProviderConfig } from '@/aiCore/index_new'
import { buildStreamTextParams } from '@/aiCore/prepareParams'
import { isDedicatedImageGenerationModel } from '@/config/models'
import { getDefaultModel } from '@/services/AssistantService'
import { loggerService } from '@/services/LoggerService'
import { McpService } from '@/services/McpService'
import { preferenceService } from '@/services/PreferenceService'
import { getProviderByModel } from '@/services/ProviderService'
import type { Assistant, Provider } from '@/types/assistant'
import type { Chunk } from '@/types/chunk'
import { ChunkType } from '@/types/chunk'
import type { Message } from '@/types/message'
import type { MCPTool } from '@/types/tool'
import { isPromptToolUse, isSupportedToolUse } from '@/utils/mcpTool'

const logger = loggerService.withContext('ApiService')

export type FetchChatCompletionParams = {
  messages: any[] // Using any[] for now as CoreMessage depends on ai sdk version
  prompt?: string
  assistant: Assistant
  options?: any
  onChunkReceived: (chunk: Chunk) => void
  topicId?: string
  uiMessages?: Message[]
}

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


export async function checkApi(provider: any, model: any, timeout?: number): Promise<void> {
  try {
    const aiProvider = new ModernAiProvider(model, provider)

    // Create a temporary assistant for the check
    const checkAssistant: Assistant = {
      id: 'check-api-assistant',
      name: 'Check API',
      prompt: 'You are a test assistant.',
      topics: [],
      type: 'system',
      model: model,
      emoji: '🧪',
    }

    let signal: AbortSignal | undefined
    if (timeout) {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), timeout)
      signal = controller.signal
    }

    // Perform a minimal completion request
    // We use a simple prompt. maxTokens is not supported in StreamTextParams directly in this version
    await aiProvider.completions(
      model.id,
      {
        prompt: 'Hi',
        abortSignal: signal,
      },
      {
        assistant: checkAssistant,
        callType: 'check',
        streamOutput: false,
        enableReasoning: false,
        isPromptToolUse: false,
        isSupportedToolUse: false,
        isImageGenerationEndpoint: false,
        enableWebSearch: false,
        enableGenerateImage: false,
        enableUrlContext: false,
        mcpTools: [],
      }
    )
  } catch (error) {
    logger.error('checkApi failed:', error as Error)
    throw error
  }
}

export async function fetchModels(provider: any): Promise<any[]> {
  try {
    const aiProvider = new ModernAiProvider(provider)
    return await aiProvider.models()
  } catch (error) {
    logger.error('fetchModels failed:', error as Error)
    throw error
  }
}


/**
 * Call AI Completions with full orchestration
 */
export async function fetchChatCompletion({
  messages,
  prompt,
  assistant,
  options, // options from OrchestrationRequest
  onChunkReceived,
  topicId,
  uiMessages,
}: FetchChatCompletionParams) {
  logger.info('fetchChatCompletion called', {
    messageCount: messages?.length || 0,
    prompt: prompt,
    assistantId: assistant.id,
    topicId,
    modelId: assistant.model?.id,
  })

  // Get base provider and apply API key rotation
  const baseProvider = getProviderByModel(assistant.model || getDefaultModel())
  const providerWithRotatedKey = {
    ...cloneDeep(baseProvider),
    apiKey: getRotatedApiKey(baseProvider),
  }

  const AI = new ModernAiProvider(assistant.model || getDefaultModel(), providerWithRotatedKey)
  const provider = AI.getActualProvider()

  const mcpTools: MCPTool[] = []
  onChunkReceived({ type: ChunkType.LLM_RESPONSE_CREATED })

  // Fetch MCP tools if enabled
  if (isPromptToolUse(assistant) || isSupportedToolUse(assistant)) {
    mcpTools.push(...(await fetchMcpTools(assistant)))
  }

  if (prompt) {
    messages = [
      {
        role: 'user',
        content: prompt,
      },
    ]
  }

  // Build parameters using the shared aiCore module
  const {
    params: aiSdkParams,
    modelId,
    capabilities,
    webSearchPluginConfig,
  } = await buildStreamTextParams(messages, assistant, provider, {
    mcpTools,
    webSearchProviderId: assistant.webSearchProviderId,
    requestOptions: options,
  })

  // Safely fallback to prompt tool use when function calling is not supported by model.
  // Note: isToolUseModeFunction and isFunctionCallingModel logic should be imported or checked
  // checks are usually in assistant utils or similar.
  // For now implementing simplified check matching usage properties
  const usePromptToolUse =
    isPromptToolUse(assistant) ||
    (assistant.settings?.toolUseMode === 'function' && assistant.model?.capabilities?.find((c) => c.type === 'function_calling') === undefined && !isPromptToolUse(assistant))

  const middlewareConfig: ModernAiProviderConfig = {
    streamOutput: assistant.settings?.streamOutput ?? true,
    onChunk: onChunkReceived,
    model: assistant.model,
    enableReasoning: capabilities.enableReasoning,
    isPromptToolUse: usePromptToolUse,
    isSupportedToolUse: isSupportedToolUse(assistant),
    isImageGenerationEndpoint: isDedicatedImageGenerationModel(assistant.model || getDefaultModel()),
    webSearchPluginConfig,
    enableWebSearch: capabilities.enableWebSearch,
    enableGenerateImage: capabilities.enableGenerateImage,
    enableUrlContext: capabilities.enableUrlContext,
    mcpTools,
    uiMessages,
    knowledgeRecognition: assistant.knowledgeRecognition,

    callType: 'chat',
    topicId,
    assistant,
  }

  await AI.completions(modelId, aiSdkParams, middlewareConfig)
}

/**
 * Fetch enabled MCP tools for the assistant
 */
export async function fetchMcpTools(assistant: Assistant): Promise<MCPTool[]> {
  try {
    const mcpService = McpService.getInstance()
    
    // Get all active servers
    const activeServers = await mcpService.getActiveMcpServers()
    const assistantMcpServers = assistant.mcpServers || []

    // Filter servers that are enabled for this assistant
    const enabledServers = activeServers.filter((server) => 
        assistantMcpServers.some((s) => s.id === server.id)
    )

    if (enabledServers.length === 0) {
        return []
    }

    const toolPromises = enabledServers.map(async (server) => {
        const tools = await mcpService.getMcpTools(server.id)
        // Check for disabled tools in the assistant config
        const disabledTools = assistantMcpServers.find(s => s.id === server.id)?.disabledTools || []
        return tools.filter(tool => !disabledTools.includes(tool.name))
    })

    const results = await Promise.all(toolPromises)
    return results.flat()

  } catch (error) {
    logger.error('Error fetching MCP tools:', error as Error)
    return []
  }
}

/**
 * Validates if the provider has an API key.
 * For now simplified version.
 */
export function hasApiKey(provider: Provider): boolean {
    if (!provider) return false
    // TODO: Add system provider checks if needed
    return !!provider.apiKey
}

/**
 * Get rotated API key for providers that support multiple keys
 */
function getRotatedApiKey(provider: Provider): string {
  if (!provider.apiKey) return ''
  
  const keys = provider.apiKey.split(',').map(k => k.trim()).filter(Boolean)
  if (keys.length === 0) return ''
  if (keys.length === 1) return keys[0]

  // TODO: Implement actual rotation persistence if needed (e.g. using MMKV)
  // For now return random or first to distribute load? 
  // Desktop uses last used key persistence. 
  // Returning first key for now to be safe and stateless.
  return keys[0]
}

